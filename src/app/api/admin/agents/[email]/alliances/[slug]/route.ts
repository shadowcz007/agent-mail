// DELETE /api/admin/agents/[email]/alliances/[slug] — Tier 4 Admin
// 将 Agent 移出联盟(API §4.3.3)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const DELETE = withAuth<{ email: string; slug: string }>(
  "T4",
  async (_req, { params }) => {
    const email = decodeURIComponent(params.email);
    const slug = decodeURIComponent(params.slug);

    const agent = await prisma.agent.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!agent) return new NextResponse(null, { status: 204 });

    await prisma.agentAlliance
      .delete({
        where: { agentId_allianceSlug: { agentId: agent.id, allianceSlug: slug } },
      })
      .catch(() => {});

    return new NextResponse(null, { status: 204 });
  }
);
