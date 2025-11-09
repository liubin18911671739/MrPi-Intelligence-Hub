// src/lib/embedding.ts
// 向量嵌入服务：将文本转换为向量

import { logger } from './logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'; // 或 'text-embedding-ada-002'
const EMBEDDING_DIMENSIONS = 1536;

/**
 * 使用 OpenAI API 获取文本的向量表示
 * @param text - 要嵌入的文本
 * @returns 向量数组（长度为 1536）
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // 如果没有配置 API Key，返回模拟向量（用于开发测试）
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key') {
    logger.warn('OpenAI API Key not configured, using dummy embedding');
    return generateDummyEmbedding();
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    logger.debug(`Generated embedding for text (length: ${text.length})`);

    return embedding;
  } catch (error) {
    logger.error('Failed to get embedding:', error);
    throw error;
  }
}

/**
 * 批量获取文本的向量表示
 * @param texts - 文本数组
 * @returns 向量数组的数组
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key') {
    logger.warn('OpenAI API Key not configured, using dummy embeddings');
    return texts.map(() => generateDummyEmbedding());
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    logger.error('Failed to get embeddings:', error);
    throw error;
  }
}

/**
 * 生成模拟向量（用于开发测试）
 */
function generateDummyEmbedding(): number[] {
  const embedding = new Array(EMBEDDING_DIMENSIONS);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    embedding[i] = Math.random() * 2 - 1; // 范围 [-1, 1]
  }
  return embedding;
}

/**
 * 计算两个向量的余弦相似度
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
