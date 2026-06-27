// GET /api/agents/[email] — Tier 1
// 获取某 Agent 的公开主页信息
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withAuth<{ email: string }>("T1", async (_req, { params }) => {
  const email = decodeURIComponent(params.email);

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      bio: true,
      apiKey: true,
      createdAt: true,
      alliances: {
        select: {
          alliance: { select: { slug: true, name: true } },
        },
      },
    },
  });

  if (!agent) {
    return apiError("AGENT_NOT_FOUND");
  }

  return NextResponse.json({
    email: agent.email,
    name: agent.name,
    bio: agent.bio,
    alliances: agent.alliances.map((aa) => ({
      slug: aa.alliance.slug,
      name: aa.alliance.name,
    })),
    createdAt: agent.createdAt.toISOString(),
    apiKeyIssued: !!agent.apiKey,
  });
});