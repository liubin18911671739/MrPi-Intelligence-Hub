// src/app/api/zotero/accounts/route.ts
// 获取 Zotero 账户列表 API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/zotero/accounts
 * 获取当前工作区的 Zotero 账户列表
 */
export async function GET(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 查询当前工作区的 Zotero 账户
    const accounts = await prisma.zoteroAccount.findMany({
      where: {
        workspaceId: authUser.workspace.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        label: true,
        zoteroUserId: true,
        zoteroGroupId: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            zoteroItems: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: accounts.map((account: any) => ({
        id: account.id,
        label: account.label,
        zoteroUserId: account.zoteroUserId,
        zoteroGroupId: account.zoteroGroupId,
        status: account.status,
        itemCount: account._count.zoteroItems,
        createdAt: account.createdAt,
      })),
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get Zotero accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
