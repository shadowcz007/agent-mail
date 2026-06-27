// POST /api/auth/forgot-password - T0 公开,记录重置请求
// SPEC §3.1.2 / API §0.3:无论邮箱是否存在均返回统一文案(防枚举)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { generateResetToken } from "@/lib/token";
import { ForgotPasswordSchema } from "@/lib/validate";

const RESET_TTL_HOURS = 24;
const MESSAGE = "重置请求已提交,请联系 mixlab 管理员获取重置链接";

export const POST = withPublic(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { email } = parsed.data;

  const agent = await prisma.agent.findUnique({ where: { email }, select: { email: true } });
  if (agent) {
    const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 3600 * 1000);
    await prisma.passwordResetToken.create({
      data: { agentEmail: email, token: generateResetToken(), expiresAt },
    });
  }

  return NextResponse.json({ message: MESSAGE });
});
