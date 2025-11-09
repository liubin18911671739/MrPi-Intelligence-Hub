// src/app/api/zotero/connect/route.ts
// Zotero 账户连接 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { checkPlanAllowsZotero } from '@/lib/permissions';
import { PlanCode } from '@prisma/client';

// 请求体验证 schema
const connectZoteroSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  zoteroUserId: z.string().optional(),
  zoteroGroupId: z.string().optional(),
  apiKey: z.string().min(1, 'API key is required'),
}).refine(
  (data) => data.zoteroUserId || data.zoteroGroupId,
  { message: 'Either zoteroUserId or zoteroGroupId must be provided' }
);

/**
 * POST /api/zotero/connect
 * 连接 Zotero 账户
 */
export async function POST(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 检查订阅计划是否允许使用 Zotero
    if (!checkPlanAllowsZotero(authUser.plan as PlanCode)) {
      return NextResponse.json(
        { error: 'Your plan does not support Zotero integration. Please upgrade to Pro or Plus.' },
        { status: 403 }
      );
    }

    // 解析和验证请求体
    const body = await req.json();
    const validatedData = connectZoteroSchema.parse(body);

    // 创建 Zotero 账户记录
    // 注意：生产环境中应该加密存储 apiKey，这里演示用明文存储
    const zoteroAccount = await prisma.zoteroAccount.create({
      data: {
        workspaceId: authUser.workspace.id,
        label: validatedData.label,
        zoteroUserId: validatedData.zoteroUserId || null,
        zoteroGroupId: validatedData.zoteroGroupId || null,
        apiKeyEncrypted: validatedData.apiKey, // 演示用明文，生产环境应加密
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: zoteroAccount.id,
        label: zoteroAccount.label,
        zoteroUserId: zoteroAccount.zoteroUserId,
        zoteroGroupId: zoteroAccount.zoteroGroupId,
        status: zoteroAccount.status,
        createdAt: zoteroAccount.createdAt,
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

    console.error('Connect Zotero error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
