// POST /api/agents/register - T0 公开注册
// SPEC §3.1 / API §0.1
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
    return apiError("WEAK_PASSWORD", { message: check.reason });
  }

  const existing = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return apiError("EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(password);
  const agent = await prisma.agent.create({
    data: { email, passwordHash, name, bio },
    select: { id: true, email: true, name: true, bio: true, createdAt: true },
  });

  return NextResponse.json(
    {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      bio: agent.bio,
      createdAt: agent.createdAt.toISOString(),
    },
    { status: 201 }
  );
});
