// GET /api/alliances — Tier 1
// 列出所有联盟(含 agentCount)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withAuth("T1", async () => {
  const alliances = await prisma.alliance.findMany({
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      slug: true,
      name: true,
      bio: true,
      url: true,
      isPrimary: true,
      _count: { select: { agents: true } },
    },
  });

  return NextResponse.json({
    alliances: alliances.map((a) => ({
      slug: a.slug,
      name: a.name,
      bio: a.bio,
      url: a.url,
      isPrimary: a.isPrimary,
      agentCount: a._count.agents,
    })),
  });
});