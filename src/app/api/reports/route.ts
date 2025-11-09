// src/app/api/reports/route.ts
// 报告生成与查询 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ReportType } from '@prisma/client';

// POST 请求体验证 schema
const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['INTELLIGENCE_BRIEF', 'PRODUCT_REPORT', 'TREND_ANALYSIS']),
  contentMd: z.string().min(1, 'Content is required'),
  metaJson: z.record(z.any()).optional(),
});

/**
 * POST /api/reports
 * 创建新报告
 */
export async function POST(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 解析和验证请求体
    const body = await req.json();
    const validatedData = createReportSchema.parse(body);

    // 创建报告
    const report = await prisma.report.create({
      data: {
        workspaceId: authUser.workspace.id,
        title: validatedData.title,
        type: validatedData.type as ReportType,
        contentMd: validatedData.contentMd,
        metaJson: (validatedData.metaJson || null) as any,
        createdById: authUser.id,
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

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        title: report.title,
        type: report.type,
        contentMd: report.contentMd,
        metaJson: report.metaJson,
        createdBy: {
          id: report.createdBy.id,
          name: report.createdBy.name,
          email: report.createdBy.email,
        },
        createdAt: report.createdAt,
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

    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * 获取当前工作区的报告列表
 * 支持分页和类型筛选
 */
export async function GET(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type'); // 可选：按类型筛选

    // 构建查询条件
    const whereCondition: any = {
      workspaceId: authUser.workspace.id,
    };

    if (type) {
      whereCondition.type = type;
    }

    // 查询报告列表
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          type: true,
          metaJson: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // 不返回完整内容，只在详情页显示
        },
      }),
      prisma.report.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + reports.length < total,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
