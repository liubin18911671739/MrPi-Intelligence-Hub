// src/lib/zotero.ts
// Zotero Web API 集成工具

import { logger } from './logger';

/**
 * Zotero Item 数据结构（简化版）
 */
export interface ZoteroItemInput {
  key: string;
  version: number;
  itemType: string;
  title?: string;
  creators?: Array<{ creatorType: string; firstName?: string; lastName?: string; name?: string }>;
  abstractNote?: string;
  tags?: Array<{ tag: string }>;
  collections?: string[];
  DOI?: string;
  url?: string;
  date?: string;
  [key: string]: any; // 其他字段
}

/**
 * 从 Zotero API 获取条目列表
 * 
 * Zotero Web API 文档：https://www.zotero.org/support/dev/web_api/v3/basics
 * 
 * 对接方式：
 * 1. 个人库：GET https://api.zotero.org/users/{userID}/items
 * 2. 群组库：GET https://api.zotero.org/groups/{groupID}/items
 * 
 * 需要在 Headers 中添加：
 * - Zotero-API-Key: {apiKey}
 * - Zotero-API-Version: 3
 * 
 * @param apiKey - Zotero API Key
 * @param userId - Zotero User ID（个人库）
 * @param groupId - Zotero Group ID（群组库，与 userId 二选一）
 * @param limit - 每次获取的条目数量（默认 100）
 * @returns Zotero 条目列表
 */
export async function fetchZoteroItems(
  apiKey: string,
  userId?: string,
  groupId?: string,
  limit: number = 100
): Promise<ZoteroItemInput[]> {
  try {
    // 构建 API URL
    let baseUrl: string;
    if (userId) {
      baseUrl = `https://api.zotero.org/users/${userId}/items`;
    } else if (groupId) {
      baseUrl = `https://api.zotero.org/groups/${groupId}/items`;
    } else {
      throw new Error('Either userId or groupId must be provided');
    }

    const url = `${baseUrl}?limit=${limit}&format=json`;

    logger.info(`Fetching Zotero items from: ${url}`);

    // 调用 Zotero API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Zotero-API-Key': apiKey,
        'Zotero-API-Version': '3',
      },
    });

    if (!response.ok) {
      throw new Error(`Zotero API error: ${response.status} ${response.statusText}`);
    }

    const items = await response.json();
    
    logger.info(`Fetched ${items.length} items from Zotero`);

    // 转换为我们的格式
    return items.map((item: any) => {
      const data = item.data || item;
      return {
        key: data.key,
        version: data.version,
        itemType: data.itemType,
        title: data.title,
        creators: data.creators,
        abstractNote: data.abstractNote,
        tags: data.tags,
        collections: data.collections,
        DOI: data.DOI,
        url: data.url,
        date: data.date,
        ...data, // 保留所有其他字段
      };
    });
  } catch (error) {
    logger.error('Failed to fetch Zotero items:', error);
    throw error;
  }
}

/**
 * 获取单个 Zotero 条目的附件列表
 * 
 * API: GET https://api.zotero.org/users/{userID}/items/{itemKey}/children
 */
export async function fetchZoteroItemAttachments(
  apiKey: string,
  userId: string | undefined,
  groupId: string | undefined,
  itemKey: string
): Promise<any[]> {
  try {
    let baseUrl: string;
    if (userId) {
      baseUrl = `https://api.zotero.org/users/${userId}/items/${itemKey}/children`;
    } else if (groupId) {
      baseUrl = `https://api.zotero.org/groups/${groupId}/items/${itemKey}/children`;
    } else {
      throw new Error('Either userId or groupId must be provided');
    }

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Zotero-API-Key': apiKey,
        'Zotero-API-Version': '3',
      },
    });

    if (!response.ok) {
      throw new Error(`Zotero API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Failed to fetch attachments for item ${itemKey}:`, error);
    return [];
  }
}

/**
 * 占位函数：模拟从 Zotero 获取数据（用于演示和测试）
 * 生产环境应该使用 fetchZoteroItems 替换
 */
export async function fetchZoteroItemsMock(
  apiKey: string,
  userId?: string,
  groupId?: string
): Promise<ZoteroItemInput[]> {
  logger.info('Using mock Zotero data (for demonstration)');
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回模拟数据
  return [
    {
      key: 'MOCK001',
      version: 1,
      itemType: 'journalArticle',
      title: 'Sample Academic Paper on AI',
      creators: [
        { creatorType: 'author', firstName: 'John', lastName: 'Doe' },
        { creatorType: 'author', firstName: 'Jane', lastName: 'Smith' },
      ],
      abstractNote: 'This is a sample abstract about artificial intelligence research.',
      tags: [{ tag: 'AI' }, { tag: 'Machine Learning' }],
      collections: [],
      DOI: '10.1234/sample.doi',
      url: 'https://example.com/paper',
      date: '2024-01-15',
    },
    {
      key: 'MOCK002',
      version: 1,
      itemType: 'book',
      title: 'Introduction to Deep Learning',
      creators: [
        { creatorType: 'author', firstName: 'Alice', lastName: 'Johnson' },
      ],
      abstractNote: 'A comprehensive guide to deep learning algorithms and applications.',
      tags: [{ tag: 'Deep Learning' }, { tag: 'Neural Networks' }],
      collections: [],
      url: 'https://example.com/book',
      date: '2023-06-01',
    },
  ];
}
