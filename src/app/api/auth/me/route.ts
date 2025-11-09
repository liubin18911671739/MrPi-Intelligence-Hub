// src/app/api/auth/me/route.ts
// 获取当前用户信息 API

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 返回用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      },
      workspace: authUser.workspace,
      plan: authUser.plan,
      features: authUser.features,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
