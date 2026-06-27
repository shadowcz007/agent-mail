// GET /api/admin/bootstrap-status — Tier 4(条件性)
// 返回 { initialized, adminCount },无鉴权(SPEC §3.5.1 / API §4.0.1)
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const adminCount = await prisma.agent.count({ where: { isAdmin: true } });
  return NextResponse.json({ initialized: adminCount > 0, adminCount });
}
