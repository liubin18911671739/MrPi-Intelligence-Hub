// src/app/api/auth/login/route.ts
// 用户登录 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, signJwt } from '@/lib/auth';
import { getEffectivePlan } from '@/lib/plans';
import { getFeaturePermissions } from '@/lib/permissions';

// 请求体验证 schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    // 解析和验证请求体
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    // 查询用户（包含工作区和权限信息）
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        ownedWorkspaces: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
        memberships: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            workspace: true,
          },
        },
        entitlements: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    // 检查用户是否存在
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 确定默认工作区
    let workspace: { id: string; name: string; role: string };
    
    if (user.ownedWorkspaces.length > 0) {
      workspace = {
        id: user.ownedWorkspaces[0].id,
        name: user.ownedWorkspaces[0].name,
        role: 'OWNER',
      };
    } else if (user.memberships.length > 0) {
      workspace = {
        id: user.memberships[0].workspace.id,
        name: user.memberships[0].workspace.name,
        role: user.memberships[0].role,
      };
    } else {
      return NextResponse.json(
        { error: 'No workspace found for user' },
        { status: 500 }
      );
    }

    // 获取生效的计划
    const effectivePlan = getEffectivePlan(user.entitlements);
    const features = getFeaturePermissions(effectivePlan);

    // 生成 JWT
    const token = signJwt({
      userId: user.id,
      email: user.email,
    });

    // 返回用户信息和 token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace,
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

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
