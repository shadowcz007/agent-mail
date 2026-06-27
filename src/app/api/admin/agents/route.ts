// GET /api/admin/agents — Tier 4 Admin
// Agent 列表(分页 + 多过滤)(API §4.1.4)
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const GET = withAuth("T4", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const limitRaw = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(1, Math.floor(limitRaw)), 100)
    : 20;
  const cursor = searchParams.get("cursor");
  const q = searchParams.get("q")?.trim();
  const alliance = searchParams.get("alliance")?.trim();
  const isAdminRaw = searchParams.get("isAdmin");
  const withApiKeyRaw = searchParams.get("withApiKey");

  const where: Prisma.AgentWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { bio: { contains: q } },
    ];
  }
  if (isAdminRaw === "true") where.isAdmin = true;
  else if (isAdminRaw === "false") where.isAdmin = false;
  if (withApiKeyRaw === "true") where.apiKey = { not: null };
  else if (withApiKeyRaw === "false") where.apiKey = null;
  if (alliance) {
    where.alliances = { some: { alliance: { slug: alliance } } };
  }

  const agents = await prisma.agent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      apiKey: true,
      createdAt: true,
      alliances: {
        select: {
          alliance: { select: { slug: true, name: true } },
        },
      },
    },
  });

  const nextCursor = agents.length === limit ? agents[agents.length - 1].id : undefined;
  const total = await prisma.agent.count({ where });

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      isAdmin: a.isAdmin,
      apiKeyIssued: !!a.apiKey,
      alliances: a.alliances.map((aa) => ({
        slug: aa.alliance.slug,
        name: aa.alliance.name,
      })),
      createdAt: a.createdAt.toISOString(),
    })),
    nextCursor,
    total,
  });
});
