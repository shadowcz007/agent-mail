// POST /api/admin/setup — Tier 4(条件性)
// 仅在 adminCount === 0 时开放;字段同 register,isAdmin = true(SPEC §3.5.1 / API §4.0.2)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { RegisterSchema, isStrongPassword } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const adminCount = await prisma.agent.count({ where: { isAdmin: true } });
  if (adminCount > 0) return apiError("ALREADY_INITIALIZED");

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
  if (existing) return apiError("EMAIL_EXISTS");

  const passwordHash = await hashPassword(password);
  const agent = await prisma.agent.create({
    data: { email, passwordHash, name, bio, isAdmin: true },
    select: { id: true, email: true, name: true, bio: true, createdAt: true },
  });

  const r = await setSessionCookie(email);
  return NextResponse.json(
    {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      bio: agent.bio,
      isAdmin: true,
      createdAt: agent.createdAt.toISOString(),
    },
    { status: 201, headers: r.headers }
  );
}
