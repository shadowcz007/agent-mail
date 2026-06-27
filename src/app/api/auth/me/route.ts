// GET /api/auth/me - T3 Session,返回当前登录 Agent
// SPEC §3.1.1 / API §3.1
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const GET = withAuth("T3", async (req: NextRequest, { auth }) => {
  const { user } = auth;
  const agent = await prisma.agent.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      alliances: { select: { alliance: { select: { slug: true, name: true } } } },
    },
  });
  if (!agent) {
    return NextResponse.json({ id: user.id, email: user.email, name: "", isAdmin: user.isAdmin, alliances: [] });
  }
  return NextResponse.json({
    id: agent.id,
    email: agent.email,
    name: agent.name,
    isAdmin: agent.isAdmin,
    alliances: agent.alliances.map((a) => ({ slug: a.alliance.slug, name: a.alliance.name })),
  });
});
