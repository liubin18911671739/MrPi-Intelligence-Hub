// src/lib/permissions.ts
// 权限检查：根据订阅等级判断功能访问权限

import { PlanCode } from '@prisma/client';

/**
 * 检查计划是否允许使用 RAG 功能
 * FREE: 不允许
 * EBOOK_ONLY: 不允许
 * PRO_MONTHLY: 允许
 * PLUS_MONTHLY: 允许
 */
export function checkPlanAllowsRag(plan: PlanCode): boolean {
  return [PlanCode.PRO_MONTHLY as PlanCode, PlanCode.PLUS_MONTHLY as PlanCode].includes(plan);
}

/**
 * 检查计划是否允许使用 Zotero 集成
 * FREE: 不允许
 * EBOOK_ONLY: 不允许
 * PRO_MONTHLY: 允许（有限配额）
 * PLUS_MONTHLY: 允许（无限制）
 */
export function checkPlanAllowsZotero(plan: PlanCode): boolean {
  return [PlanCode.PRO_MONTHLY as PlanCode, PlanCode.PLUS_MONTHLY as PlanCode].includes(plan);
}

/**
 * 检查计划是否允许团队功能（多成员协作）
 * FREE: 不允许
 * EBOOK_ONLY: 不允许
 * PRO_MONTHLY: 不允许
 * PLUS_MONTHLY: 允许
 */
export function checkPlanAllowsTeam(plan: PlanCode): boolean {
  return plan === PlanCode.PLUS_MONTHLY;
}

/**
 * 检查计划是否允许创建多个语料库
 * FREE: 1 个
 * EBOOK_ONLY: 1 个
 * PRO_MONTHLY: 3 个
 * PLUS_MONTHLY: 无限
 */
export function getMaxCorpusCount(plan: PlanCode): number | null {
  switch (plan) {
    case PlanCode.FREE:
    case PlanCode.EBOOK_ONLY:
      return 1;
    case PlanCode.PRO_MONTHLY:
      return 3;
    case PlanCode.PLUS_MONTHLY:
      return null; // 无限
    default:
      return 1;
  }
}

/**
 * 检查计划是否允许高级报告功能
 * FREE: 基础报告
 * EBOOK_ONLY: 基础报告
 * PRO_MONTHLY: 高级报告
 * PLUS_MONTHLY: 高级报告 + AI 增强
 */
export function checkPlanAllowsAdvancedReports(plan: PlanCode): boolean {
  return [PlanCode.PRO_MONTHLY as PlanCode, PlanCode.PLUS_MONTHLY as PlanCode].includes(plan);
}

/**
 * 获取所有功能权限的摘要
 */
export function getFeaturePermissions(plan: PlanCode) {
  return {
    rag: checkPlanAllowsRag(plan),
    zotero: checkPlanAllowsZotero(plan),
    team: checkPlanAllowsTeam(plan),
    maxCorpus: getMaxCorpusCount(plan),
    advancedReports: checkPlanAllowsAdvancedReports(plan),
  };
}
