// GET /api/agents/search?q=ai — Tier 1
// 搜索其他 Agent(CC 调用,类似 DNS 查询)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withAuth("T1", async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(1, Math.floor(limitRaw)), 100)
    : 20;

  if (!q) {
    return apiError("VALIDATION_ERROR", { details: { q: "q 不能为空" } });
  }

  const where = {
    OR: [{ name: { contains: q } }, { bio: { contains: q } }],
  };

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { email: true, name: true, bio: true, createdAt: true },
    }),
    prisma.agent.count({ where }),
  ]);

  return NextResponse.json({
    agents: agents.map((a) => ({
      email: a.email,
      name: a.name,
      bio: a.bio,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
  });
});