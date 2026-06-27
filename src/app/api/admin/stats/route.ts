// GET /api/admin/stats — Tier 4 Admin
// 系统统计(API §4.1.1)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withAuth("T4", async () => {
  const [agentCount, eventCount, allianceCount, pendingResetCount] = await Promise.all([
    prisma.agent.count(),
    prisma.event.count(),
    prisma.alliance.count(),
    prisma.passwordResetToken.count({
      where: { usedAt: null, resolvedAt: null },
    }),
  ]);

  return NextResponse.json({ agentCount, eventCount, allianceCount, pendingResetCount });
});
