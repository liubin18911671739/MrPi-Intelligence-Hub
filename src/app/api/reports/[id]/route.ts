// src/app/api/reports/[id]/route.ts
// 单个报告的详情 API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/reports/[id]
 * 获取单个报告的详细信息
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 查询报告
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        workspaceId: authUser.workspace.id, // 确保只能访问自己工作区的报告
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        title: report.title,
        type: report.type,
        contentMd: report.contentMd,
        metaJson: report.metaJson,
        createdBy: report.createdBy,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * 删除报告
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 查询报告（确保存在且属于当前工作区）
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        workspaceId: authUser.workspace.id,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // 删除报告
    await prisma.report.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
