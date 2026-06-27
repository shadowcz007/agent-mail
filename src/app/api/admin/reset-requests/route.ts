// GET /api/admin/reset-requests — Tier 4 Admin
// 列出重置请求(API §4.1.2)
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Status = "pending" | "resolved" | "used" | "all";

export const GET = withAuth("T4", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? "pending") as Status;

  const where =
    status === "pending"
      ? { usedAt: null, resolvedAt: null }
      : status === "resolved"
        ? { resolvedAt: { not: null }, usedAt: null }
        : status === "used"
          ? { usedAt: { not: null } }
          : {};

  const requests = await prisma.passwordResetToken.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      agentEmail: r.agentEmail,
      token: r.token,
      expiresAt: r.expiresAt.toISOString(),
      usedAt: r.usedAt?.toISOString() ?? null,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});
