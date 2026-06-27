// POST /api/admin/reset-requests/[id]/resolve — Tier 4 Admin
// 标记「已发送链接」(API §4.1.3)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = withAuth<{ id: string }>("T4", async (_req, { params }) => {
  const existing = await prisma.passwordResetToken.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) return apiError("RESET_REQUEST_NOT_FOUND");

  const now = new Date();
  const request = await prisma.passwordResetToken.update({
    where: { id: params.id },
    data: { resolvedAt: now },
  });

  return NextResponse.json({
    id: request.id,
    agentEmail: request.agentEmail,
    token: request.token,
    expiresAt: request.expiresAt.toISOString(),
    usedAt: request.usedAt?.toISOString() ?? null,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
  });
});
