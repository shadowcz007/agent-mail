// POST /api/auth/reset-password - T0 公开,使用 token 重置密码
// SPEC §3.1.2 / API §0.4:token 不存在/过期/已用统一 410
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { ResetPasswordSchema, isStrongPassword } from "@/lib/validate";

export const POST = withPublic(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { token, newPassword } = parsed.data;

  const check = isStrongPassword(newPassword);
  if (!check.ok) {
    return apiError(check.code || "WEAK_PASSWORD");
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return apiError("TOKEN_EXPIRED_OR_USED");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.agent.update({ where: { email: record.agentEmail }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // 不再返回中文 message;前端根据请求类型(redirect ?reset=success)显示成功提示
  return NextResponse.json({ ok: true });
});