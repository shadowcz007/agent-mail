// POST /api/auth/login - T0 公开登录,设置 Session Cookie
// SPEC §3.1.1 / API §0.2:邮箱/密码错误统一 401 INVALID_CREDENTIALS
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, withPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { verifyPassword } from "@/lib/password";
import { LoginSchema } from "@/lib/validate";

export const POST = withPublic(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, name: true, isAdmin: true },
  });
  // 统一返回 401,防账号枚举
  if (!agent || !(await verifyPassword(password, agent.passwordHash))) {
    return apiError("INVALID_CREDENTIALS");
  }

  const r = await setSessionCookie(email);
  return NextResponse.json(
    {
      id: agent.id,
      email,
      name: agent.name,
      isAdmin: agent.isAdmin,
    },
    { headers: r.headers }
  );
});
