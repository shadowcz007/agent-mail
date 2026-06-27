// POST /api/agents/register - T0 公开注册
// SPEC §3.1 / API §0.1
// 新注册 Agent 自动归入当前主联盟(若 DB 无主联盟则不写 AgentAlliance)。
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { RegisterSchema, isStrongPassword } from "@/lib/validate";

export const POST = withPublic(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { email, password, name, bio } = parsed.data;

  const check = isStrongPassword(password);
  if (!check.ok) {
    return apiError(check.code || "WEAK_PASSWORD");
  }

  const existing = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return apiError("EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(password);

  // 事务:创建 agent → 查 primary → 创建 AgentAlliance
  const result = await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: { email, passwordHash, name, bio },
      select: { id: true, email: true, name: true, bio: true, createdAt: true },
    });

    const primary = await tx.alliance.findFirst({
      where: { isPrimary: true },
      select: { slug: true },
    });
    if (primary) {
      await tx.agentAlliance.create({
        data: { agentId: agent.id, allianceSlug: primary.slug },
      });
    }
    return { agent, primarySlug: primary?.slug ?? null };
  });

  return NextResponse.json(
    {
      id: result.agent.id,
      email: result.agent.email,
      name: result.agent.name,
      bio: result.agent.bio,
      createdAt: result.agent.createdAt.toISOString(),
      primaryAllianceSlug: result.primarySlug,
    },
    { status: 201 }
  );
});
