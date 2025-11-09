// src/app/api/zotero/sync/route.ts
// Zotero 数据同步 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { checkPlanAllowsZotero } from '@/lib/permissions';
import { fetchZoteroItems, fetchZoteroItemsMock } from '@/lib/zotero';
import { logger } from '@/lib/logger';
import { PlanCode, SourceType } from '@prisma/client';

// 请求体验证 schema
const syncZoteroSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  createCorpusDocuments: z.boolean().optional().default(true),
  corpusId: z.string().optional(), // 指定要同步到的语料库 ID
});

/**
 * POST /api/zotero/sync
 * 同步 Zotero 数据到本地数据库
 */
export async function POST(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 检查订阅计划
    if (!checkPlanAllowsZotero(authUser.plan as PlanCode)) {
      return NextResponse.json(
        { error: 'Your plan does not support Zotero integration.' },
        { status: 403 }
      );
    }

    // 解析和验证请求体
    const body = await req.json();
    const validatedData = syncZoteroSchema.parse(body);

    // 获取 Zotero 账户信息
    const zoteroAccount = await prisma.zoteroAccount.findFirst({
      where: {
        id: validatedData.accountId,
        workspaceId: authUser.workspace.id,
      },
    });

    if (!zoteroAccount) {
      return NextResponse.json(
        { error: 'Zotero account not found' },
        { status: 404 }
      );
    }

    if (zoteroAccount.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Zotero account is not active' },
        { status: 400 }
      );
    }

    logger.info(`Starting Zotero sync for account ${zoteroAccount.id}`);

    // 从 Zotero API 获取数据
    // 演示用：使用 mock 函数，生产环境应使用 fetchZoteroItems
    const USE_MOCK = process.env.USE_ZOTERO_MOCK === 'true' || true; // 默认使用 mock
    
    const zoteroItems = USE_MOCK
      ? await fetchZoteroItemsMock(
          zoteroAccount.apiKeyEncrypted,
          zoteroAccount.zoteroUserId || undefined,
          zoteroAccount.zoteroGroupId || undefined
        )
      : await fetchZoteroItems(
          zoteroAccount.apiKeyEncrypted,
          zoteroAccount.zoteroUserId || undefined,
          zoteroAccount.zoteroGroupId || undefined
        );

    logger.info(`Fetched ${zoteroItems.length} items from Zotero`);

    // 同步数据到数据库
    let syncedCount = 0;
    let createdDocumentsCount = 0;

    for (const item of zoteroItems) {
      // 1. 创建或更新 ZoteroItem
      const zoteroItem = await prisma.zoteroItem.upsert({
        where: {
          zoteroAccountId_zoteroItemKey: {
            zoteroAccountId: zoteroAccount.id,
            zoteroItemKey: item.key,
          },
        },
        create: {
          zoteroAccountId: zoteroAccount.id,
          zoteroItemKey: item.key,
          itemType: item.itemType,
          title: item.title || null,
          creatorsJson: (item.creators || null) as any,
          abstract: item.abstractNote || null,
          tagsJson: (item.tags || null) as any,
          collectionsJson: (item.collections || null) as any,
          doi: item.DOI || null,
          url: item.url || null,
          hasAttachment: false, // 简化处理，可以后续通过 children API 检查
          rawJson: item,
          lastSyncedAt: new Date(),
        },
        update: {
          itemType: item.itemType,
          title: item.title || null,
          creatorsJson: (item.creators || null) as any,
          abstract: item.abstractNote || null,
          tagsJson: (item.tags || null) as any,
          collectionsJson: (item.collections || null) as any,
          doi: item.DOI || null,
          url: item.url || null,
          rawJson: item,
          lastSyncedAt: new Date(),
        },
      });

      syncedCount++;

      // 2. 可选：创建对应的 CorpusDocument
      if (validatedData.createCorpusDocuments && item.itemType !== 'attachment') {
        // 如果指定了 corpusId，使用指定的；否则创建默认语料库
        let targetCorpusId = validatedData.corpusId;

        if (!targetCorpusId) {
          // 查找或创建默认 Zotero 语料库
          const defaultCorpus = await prisma.corpus.findFirst({
            where: {
              workspaceId: authUser.workspace.id,
              name: 'Zotero Library',
            },
          });

          if (defaultCorpus) {
            targetCorpusId = defaultCorpus.id;
          } else {
            const newCorpus = await prisma.corpus.create({
              data: {
                workspaceId: authUser.workspace.id,
                name: 'Zotero Library',
                description: 'Automatically created corpus for Zotero items',
                type: 'ACADEMIC',
              },
            });
            targetCorpusId = newCorpus.id;
          }
        }

        // 检查是否已经存在对应的文档
        const existingDoc = await prisma.corpusDocument.findFirst({
          where: {
            workspaceId: authUser.workspace.id,
            sourceType: SourceType.ZOTERO,
            sourceRef: zoteroItem.id,
          },
        });

        if (!existingDoc) {
          // 提取作者信息
          const authors = Array.isArray(item.creators)
            ? item.creators
                .map((c: any) => {
                  if (c.name) return c.name;
                  return [c.firstName, c.lastName].filter(Boolean).join(' ');
                })
                .join(', ')
            : null;

          // 提取标签
          const tags = Array.isArray(item.tags)
            ? item.tags.map((t: any) => t.tag)
            : null;

          await prisma.corpusDocument.create({
            data: {
              workspaceId: authUser.workspace.id,
              corpusId: targetCorpusId,
              sourceType: SourceType.ZOTERO,
              sourceRef: zoteroItem.id,
              title: item.title || 'Untitled',
              authors,
              abstract: item.abstractNote || null,
              content: item.abstractNote || null, // 简化处理，实际可以包含更多内容
              lang: 'en', // 默认英文，可以后续添加语言检测
              tags: tags as any,
              publishedAt: item.date ? new Date(item.date) : null,
              url: item.url || null,
              metaJson: {
                doi: item.DOI,
                itemType: item.itemType,
                zoteroKey: item.key,
              },
            },
          });

          createdDocumentsCount++;
        }
      }
    }

    logger.info(
      `Zotero sync completed: ${syncedCount} items synced, ${createdDocumentsCount} documents created`
    );

    return NextResponse.json({
      success: true,
      data: {
        syncedItems: syncedCount,
        createdDocuments: createdDocumentsCount,
        accountId: zoteroAccount.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.error('Zotero sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
