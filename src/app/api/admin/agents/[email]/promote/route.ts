// POST /api/admin/agents/[email]/promote — Tier 4 Admin
// 把某 Agent 提升为 admin。已经是 admin 则幂等 noop。
// 注意:此端点不验证"系统必须始终有 admin" —
// 任何已存在的 admin 都可以自由 promote 其他人。
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = withAuth<{ email: string }>("T4", async (_req: NextRequest, { params }) => {
  const email = decodeURIComponent(params.email);

  const target = await prisma.agent.findUnique({
    where: { email },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!target) return apiError("AGENT_NOT_FOUND");

  if (target.isAdmin) {
    return NextResponse.json({
      email: target.email,
      isAdmin: true,
      alreadyAdmin: true,
    });
  }

  await prisma.agent.update({
    where: { email: target.email },
    data: { isAdmin: true },
  });

  return NextResponse.json({
    email: target.email,
    isAdmin: true,
    alreadyAdmin: false,
  });
});