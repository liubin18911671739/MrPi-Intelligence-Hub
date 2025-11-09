// src/lib/plans.ts
// 订阅计划相关逻辑：等级优先级、生效计划判断

import { PlanCode, Entitlement, EntitlementStatus } from '@prisma/client';

// 计划等级优先级（数字越大等级越高）
const PLAN_PRIORITY: Record<PlanCode, number> = {
  FREE: 0,
  EBOOK_ONLY: 1,
  PRO_MONTHLY: 2,
  PLUS_MONTHLY: 3,
};

/**
 * 从用户的所有权限记录中推断当前生效的计划
 * 逻辑：
 * 1. 筛选出 ACTIVE 状态的权限
 * 2. 筛选出未过期的权限（expiresAt 为 null 或在未来）
 * 3. 按优先级排序，返回最高等级的计划
 */
export function getEffectivePlan(entitlements: Entitlement[]): PlanCode {
  const now = new Date();
  
  const activeEntitlements = entitlements.filter((e) => {
    // 必须是 ACTIVE 状态
    if (e.status !== EntitlementStatus.ACTIVE) {
      return false;
    }
    
    // 如果没有过期时间，则永久有效
    if (!e.expiresAt) {
      return true;
    }
    
    // 如果有过期时间，检查是否已过期
    return e.expiresAt > now;
  });

  // 如果没有有效的权限，返回 FREE
  if (activeEntitlements.length === 0) {
    return PlanCode.FREE;
  }

  // 按优先级排序，取最高的
  activeEntitlements.sort((a, b) => {
    return PLAN_PRIORITY[b.planCode] - PLAN_PRIORITY[a.planCode];
  });

  return activeEntitlements[0].planCode;
}

/**
 * 比较两个计划的等级
 * @returns 正数表示 plan1 > plan2，负数表示 plan1 < plan2，0 表示相等
 */
export function comparePlans(plan1: PlanCode, plan2: PlanCode): number {
  return PLAN_PRIORITY[plan1] - PLAN_PRIORITY[plan2];
}

/**
 * 检查计划是否至少达到某个等级
 */
export function isPlanAtLeast(currentPlan: PlanCode, requiredPlan: PlanCode): boolean {
  return PLAN_PRIORITY[currentPlan] >= PLAN_PRIORITY[requiredPlan];
}
