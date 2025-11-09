// src/app/api/rag/query/route.ts
// RAG 查询 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { checkPlanAllowsRag } from '@/lib/permissions';
import { ragQuery } from '@/lib/rag';
import { PlanCode } from '@prisma/client';
import { logger } from '@/lib/logger';

// 请求体验证 schema
const ragQuerySchema = z.object({
  question: z.string().min(1, 'Question is required'),
  corpusIds: z.array(z.string()).optional(),
  topK: z.number().min(1).max(20).optional().default(5),
});

/**
 * POST /api/rag/query
 * RAG 查询接口
 */
export async function POST(req: NextRequest) {
  try {
    // 鉴权
    const authUser = await requireAuth(req);

    // 检查订阅计划是否允许使用 RAG
    if (!checkPlanAllowsRag(authUser.plan as PlanCode)) {
      return NextResponse.json(
        { 
          error: 'Your plan does not support RAG queries. Please upgrade to Pro or Plus.',
          requiredPlan: 'PRO_MONTHLY',
        },
        { status: 403 }
      );
    }

    // 解析和验证请求体
    const body = await req.json();
    const validatedData = ragQuerySchema.parse(body);

    logger.info(`RAG query from user ${authUser.id}: "${validatedData.question}"`);

    // 执行 RAG 查询
    const result = await ragQuery({
      workspaceId: authUser.workspace.id,
      question: validatedData.question,
      corpusIds: validatedData.corpusIds,
      topK: validatedData.topK,
    });

    return NextResponse.json({
      success: true,
      data: {
        question: validatedData.question,
        answer: result.answer,
        citations: result.citations,
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

    logger.error('RAG query error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
