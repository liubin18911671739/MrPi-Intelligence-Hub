// src/lib/rag.ts
// RAG (Retrieval-Augmented Generation) 实现

import { prisma } from './db';
import { getEmbedding, cosineSimilarity } from './embedding';
import { logger } from './logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CHAT_MODEL = 'gpt-4o-mini'; // 或 'gpt-3.5-turbo'

/**
 * RAG 查询接口
 */
export interface RagQuery {
  workspaceId: string;
  question: string;
  corpusIds?: string[]; // 可选：指定要搜索的语料库
  topK?: number; // 返回的相关文档数量
}

/**
 * RAG 查询结果
 */
export interface RagResult {
  answer: string;
  citations: Array<{
    docId: string;
    title: string;
    snippet: string;
    similarity: number;
  }>;
}

/**
 * 使用向量相似度搜索相关文档片段
 * 
 * 注意：这里使用 JSON 存储的向量进行内存计算
 * 如果使用 pgvector，应该直接使用 SQL 查询：
 * 
 * SELECT * FROM "EmbeddingChunk" 
 * WHERE "corpusDocumentId" IN (...)
 * ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector 
 * LIMIT 10;
 * 
 * 或使用 Prisma 的 raw query：
 * await prisma.$queryRaw`
 *   SELECT ec.*, cd.title, cd.authors
 *   FROM "EmbeddingChunk" ec
 *   JOIN "CorpusDocument" cd ON ec."corpusDocumentId" = cd.id
 *   WHERE cd."workspaceId" = ${workspaceId}
 *   ORDER BY ec.embedding <=> ${embedding}::vector
 *   LIMIT ${topK}
 * `
 */
async function searchSimilarChunks(
  workspaceId: string,
  questionEmbedding: number[],
  corpusIds?: string[],
  topK: number = 5
): Promise<Array<{
  chunkId: string;
  text: string;
  similarity: number;
  document: {
    id: string;
    title: string;
    authors: string | null;
    url: string | null;
  };
}>> {
  try {
    // 构建查询条件
    const whereCondition: any = {
      corpusDocument: {
        workspaceId,
      },
    };

    if (corpusIds && corpusIds.length > 0) {
      whereCondition.corpusDocument.corpusId = {
        in: corpusIds,
      };
    }

    // 获取所有相关的 chunks
    const chunks = await prisma.embeddingChunk.findMany({
      where: whereCondition,
      select: {
        id: true,
        text: true,
        embedding: true,
        corpusDocument: {
          select: {
            id: true,
            title: true,
            authors: true,
            url: true,
          },
        },
      },
    });

    logger.info(`Found ${chunks.length} chunks to compare`);

    // 计算相似度并排序
    const chunksWithSimilarity = chunks.map((chunk: any) => {
      // 解析存储的向量
      const chunkEmbedding = JSON.parse(chunk.embedding);
      const similarity = cosineSimilarity(questionEmbedding, chunkEmbedding);

      return {
        chunkId: chunk.id,
        text: chunk.text,
        similarity,
        document: chunk.corpusDocument,
      };
    });

    // 按相似度降序排序，取 topK
    chunksWithSimilarity.sort((a: any, b: any) => b.similarity - a.similarity);
    const topChunks = chunksWithSimilarity.slice(0, topK);

    logger.info(`Selected top ${topChunks.length} most similar chunks`);

    return topChunks;
  } catch (error) {
    logger.error('Failed to search similar chunks:', error);
    throw error;
  }
}

/**
 * 使用 LLM 生成答案
 */
async function generateAnswer(
  question: string,
  context: string
): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key') {
    logger.warn('OpenAI API Key not configured, returning dummy answer');
    return `这是一个模拟答案。您的问题是："${question}"。由于未配置 OpenAI API Key，无法生成真实答案。`;
  }

  try {
    const prompt = `你是一个专业的智能助手。请根据以下上下文信息回答用户的问题。

上下文信息：
${context}

用户问题：${question}

请基于上下文提供准确、专业的回答。如果上下文中没有相关信息，请明确说明。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_CHAT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    logger.error('Failed to generate answer:', error);
    throw error;
  }
}

/**
 * RAG 查询主函数
 */
export async function ragQuery(query: RagQuery): Promise<RagResult> {
  try {
    logger.info(`Processing RAG query: "${query.question}"`);

    // 1. 将问题转换为向量
    const questionEmbedding = await getEmbedding(query.question);

    // 2. 搜索相关文档片段
    const topK = query.topK || 5;
    const similarChunks = await searchSimilarChunks(
      query.workspaceId,
      questionEmbedding,
      query.corpusIds,
      topK
    );

    if (similarChunks.length === 0) {
      return {
        answer: '抱歉，在语料库中没有找到与您问题相关的信息。',
        citations: [],
      };
    }

    // 3. 构建上下文
    const context = similarChunks
      .map((chunk, idx) => {
        return `[文档 ${idx + 1}: ${chunk.document.title}]\n${chunk.text}`;
      })
      .join('\n\n---\n\n');

    // 4. 使用 LLM 生成答案
    const answer = await generateAnswer(query.question, context);

    // 5. 构建引用信息
    const citations = similarChunks.map(chunk => ({
      docId: chunk.document.id,
      title: chunk.document.title,
      snippet: chunk.text.substring(0, 200) + '...',
      similarity: chunk.similarity,
    }));

    logger.info('RAG query completed successfully');

    return {
      answer,
      citations,
    };
  } catch (error) {
    logger.error('RAG query failed:', error);
    throw error;
  }
}
