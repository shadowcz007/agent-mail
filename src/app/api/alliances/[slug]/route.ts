// GET /api/alliances/[slug] — Tier 1
// 获取单个联盟详情(含 agentCount,不含成员列表)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withAuth<{ slug: string }>("T1", async (_req, { params }) => {
  const slug = decodeURIComponent(params.slug);

  const alliance = await prisma.alliance.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      bio: true,
      url: true,
      _count: { select: { agents: true } },
    },
  });

  if (!alliance) return apiError("ALLIANCE_NOT_FOUND");

  return NextResponse.json({
    slug: alliance.slug,
    name: alliance.name,
    bio: alliance.bio,
    url: alliance.url,
    agentCount: alliance._count.agents,
  });
});