// src/lib/auth.ts
// 认证相关工具：密码哈希、JWT 签发与验证、请求鉴权

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from './db';
import { getEffectivePlan } from './plans';
import { getFeaturePermissions } from './permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

/**
 * 对明文密码进行哈希
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * 验证明文密码与哈希值是否匹配
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * JWT Payload 类型
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * 签发 JWT Token
 * @param payload - 要编码的数据
 * @param expiresIn - 过期时间（默认 7 天）
 */
export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string = '7d'): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * 验证并解析 JWT Token
 * @returns payload 或 null（如果无效）
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * 认证后的用户信息（包含当前生效的计划和功能权限）
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  workspace: {
    id: string;
    name: string;
    role: string;
  };
  plan: string;
  features: {
    rag: boolean;
    zotero: boolean;
    team: boolean;
    maxCorpus: number | null;
    advancedReports: boolean;
  };
}

/**
 * 从 NextRequest 中提取并验证用户身份
 * @returns AuthUser 或 null
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    // 从 Authorization header 中提取 token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyJwt(token);
    
    if (!payload) {
      return null;
    }

    // 查询用户信息（包含工作区和权限）
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    if (!user) {
      return null;
    }

    // 确定默认工作区（优先选择自己拥有的，其次是加入的）
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
      // 理论上不应该发生（注册时会创建工作区）
      return null;
    }

    // 获取生效的计划
    const effectivePlan = getEffectivePlan(user.entitlements);
    
    // 获取功能权限
    const features = getFeaturePermissions(effectivePlan);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      workspace,
      plan: effectivePlan,
      features,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * API 路由中的统一鉴权辅助函数
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
