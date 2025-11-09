// src/app/api/captured-items/route.ts
// Chrome 插件和 Web App 的数据采集 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { CapturedSource } from '@prisma/client';

// POST 请求体验证 schema
const createCapturedItemSchema = z.object({
  url: z.string().url('Invalid URL format'),
  title: z.string().min(1, 'Title is required'),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['CHROME_EXTENSION', 'WEB_APP']),
});

/**
 * POST /api/captured-items
 * 创建新的采集项
 * 
 * Chrome 插件调用示例：
 * fetch('http://localhost:3000/api/captured-items', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     url: 'https://example.com/article',
 *     title: 'Example Article',
 *     note: 'My notes about this article',
 *     tags: ['tech', 'ai'],
 *     source: 'CHROME_EXTENSION'
 *   })
 * });
 */
export async function POST(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 解析和验证请求体
    const body = await req.json();
    const validatedData = createCapturedItemSchema.parse(body);

    // 创建采集项
    const capturedItem = await prisma.capturedItem.create({
      data: {
        workspaceId: authUser.workspace.id,
        userId: authUser.id,
        url: validatedData.url,
        title: validatedData.title,
        note: validatedData.note || null,
        tags: (validatedData.tags || null) as any,
        source: validatedData.source as CapturedSource,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: capturedItem.id,
        url: capturedItem.url,
        title: capturedItem.title,
        note: capturedItem.note,
        tags: capturedItem.tags,
        source: capturedItem.source,
        createdAt: capturedItem.createdAt,
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

    console.error('Create captured item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/captured-items
 * 获取当前工作区的采集项列表
 * 支持分页（?limit=20&offset=0）
 */
export async function GET(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 查询采集项（只返回当前工作区的数据）
    const [items, total] = await Promise.all([
      prisma.capturedItem.findMany({
        where: {
          workspaceId: authUser.workspace.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          url: true,
          title: true,
          note: true,
          tags: true,
          source: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.capturedItem.count({
        where: {
          workspaceId: authUser.workspace.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get captured items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
