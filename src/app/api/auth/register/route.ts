// src/app/api/auth/register/route.ts
// 用户注册 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, signJwt } from '@/lib/auth';
import { getEffectivePlan } from '@/lib/plans';
import { getFeaturePermissions } from '@/lib/permissions';
import { PlanCode, EntitlementSource, WorkspaceRole } from '@prisma/client';

// 请求体验证 schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 解析和验证请求体
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // 哈希密码
    const passwordHash = await hashPassword(validatedData.password);

    // 在事务中创建用户、工作区、成员关系和免费权限
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. 创建用户
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          name: validatedData.name || null,
        },
      });

      // 2. 创建默认工作区（以用户名或邮箱前缀命名）
      const workspaceName = validatedData.name 
        ? `${validatedData.name}'s Workspace`
        : `${validatedData.email.split('@')[0]}'s Workspace`;

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          ownerId: user.id,
        },
      });

      // 3. 创建成员关系（Owner）
      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      // 4. 创建免费权限
      await tx.entitlement.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          planCode: PlanCode.FREE,
          source: EntitlementSource.MANUAL,
          status: 'ACTIVE',
        },
      });

      return { user, workspace };
    });

    // 获取生效的计划（此时应该是 FREE）
    const entitlements = await prisma.entitlement.findMany({
      where: {
        userId: result.user.id,
        status: 'ACTIVE',
      },
    });

    const effectivePlan = getEffectivePlan(entitlements);
    const features = getFeaturePermissions(effectivePlan);

    // 生成 JWT
    const token = signJwt({
      userId: result.user.id,
      email: result.user.email,
    });

    // 返回用户信息和 token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        role: 'OWNER',
      },
      plan: effectivePlan,
      features,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
