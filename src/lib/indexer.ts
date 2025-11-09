// src/lib/indexer.ts
// 文档索引器：将文档切块并生成向量索引

import { prisma } from './db';
import { getEmbedding } from './embedding';
import { logger } from './logger';

/**
 * 将文本切分为 chunks
 * @param text - 要切分的文本
 * @param chunkSize - 每个 chunk 的最大字符数
 * @param overlap - chunk 之间的重叠字符数
 * @returns chunk 数组
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);

    // 如果已经到达文本末尾，退出循环
    if (end === text.length) {
      break;
    }

    // 下一个 chunk 的起始位置（考虑重叠）
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * 为 CorpusDocument 生成向量索引
 * @param docId - 文档 ID
 */
export async function indexCorpusDocument(docId: string): Promise<void> {
  try {
    logger.info(`Starting indexing for document ${docId}`);

    // 获取文档
    const doc = await prisma.corpusDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new Error(`Document ${docId} not found`);
    }

    // 确定要索引的文本（优先使用 content，其次 abstract）
    const textToIndex = doc.content || doc.abstract;

    if (!textToIndex || textToIndex.trim().length === 0) {
      logger.warn(`Document ${docId} has no content to index`);
      return;
    }

    // 删除已有的 chunks（如果重新索引）
    await prisma.embeddingChunk.deleteMany({
      where: { corpusDocumentId: docId },
    });

    // 将文本切分为 chunks
    const chunks = splitTextIntoChunks(textToIndex);
    logger.info(`Split document ${docId} into ${chunks.length} chunks`);

    // 为每个 chunk 生成向量并存储
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 获取向量
      const embedding = await getEmbedding(chunk);
      
      // 存储向量（序列化为 JSON 字符串）
      // 注意：如果使用 pgvector，这里应该直接存储为 vector 类型
      const embeddingJson = JSON.stringify(embedding);

      await prisma.embeddingChunk.create({
        data: {
          corpusDocumentId: docId,
          chunkIndex: i,
          text: chunk,
          embedding: embeddingJson,
        },
      });

      logger.debug(`Indexed chunk ${i + 1}/${chunks.length} for document ${docId}`);
    }

    logger.info(`Successfully indexed document ${docId} with ${chunks.length} chunks`);
  } catch (error) {
    logger.error(`Failed to index document ${docId}:`, error);
    throw error;
  }
}

/**
 * 批量索引多个文档
 * @param docIds - 文档 ID 数组
 */
export async function indexMultipleDocuments(docIds: string[]): Promise<void> {
  logger.info(`Starting batch indexing for ${docIds.length} documents`);

  for (const docId of docIds) {
    try {
      await indexCorpusDocument(docId);
    } catch (error) {
      logger.error(`Failed to index document ${docId}, continuing...`, error);
    }
  }

  logger.info(`Batch indexing completed`);
}

/**
 * 索引整个语料库
 * @param corpusId - 语料库 ID
 */
export async function indexCorpus(corpusId: string): Promise<void> {
  logger.info(`Starting indexing for corpus ${corpusId}`);

  // 获取所有未索引的文档
  const documents = await prisma.corpusDocument.findMany({
    where: {
      corpusId,
    },
    select: {
      id: true,
    },
  });

  const docIds = documents.map((doc: any) => doc.id);
  await indexMultipleDocuments(docIds);

  logger.info(`Corpus ${corpusId} indexing completed`);
}
