// Alliance 共享 helper —— 提供给首页 / admin 共用。
// 关键不变量:Alliance.isPrimary 全局最多 1 个 true(应用层 PATCH 事务保证)。
import { prisma } from "@/lib/db";

export interface PrimaryAllianceResult {
  /** 主联盟或 fallback 联盟;若 DB 完全无 Alliance 则为 null */
  alliance: {
    id: string;
    slug: string;
    name: string;
    bio: string;
    url: string | null;
    isPrimary: boolean;
  } | null;
  /** true = DB 里没有 isPrimary=true,降级到 createdAt asc 第一条 */
  autoSelected: boolean;
}

/**
 * 取主联盟;若 DB 无 isPrimary=true,降级到 createdAt asc 第一条联盟。
 * 不抛错、不 404 —— DB 完全空时返回 `{ alliance: null, autoSelected: false }`。
 */
export async function getPrimaryAllianceOrFallback(): Promise<PrimaryAllianceResult> {
  const primary = await prisma.alliance.findFirst({
    where: { isPrimary: true },
    orderBy: { createdAt: "asc" },
  });
  if (primary) {
    return { alliance: primary, autoSelected: false };
  }
  const fallback = await prisma.alliance.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return { alliance: fallback, autoSelected: !!fallback };
}
