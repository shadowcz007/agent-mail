// POST /api/admin/agents/[email]/demote — Tier 4 Admin
// 取消某 Agent 的 admin 身份。
// 约束:若这是最后一个 admin,请求体必须携带 newAdminEmail,
//       系统会原子地把目标提升为 admin,同时取消当前 admin。
//       没有 newAdminEmail + 唯一 admin → 返回 409 LAST_ADMIN。
// body: { newAdminEmail?: string }
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { z } from "zod";
import { EMAIL_REGEX } from "@/lib/validate";

export const dynamic = "force-dynamic";

const DemoteSchema = z.object({
  newAdminEmail: z
    .string()
    .regex(EMAIL_REGEX, "必须是 @agent.qq.com 邮箱")
    .optional(),
});

export const POST = withAuth<{ email: string }>("T4", async (req: NextRequest, { params }) => {
  const email = decodeURIComponent(params.email);
  const body = await req.json().catch(() => ({}));
  const parsed = DemoteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { newAdminEmail } = parsed.data;

  // 1. 查目标 agent
  const target = await prisma.agent.findUnique({
    where: { email },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!target) return apiError("AGENT_NOT_FOUND");

  // 2. 已经是 admin? → idem noop
  if (!target.isAdmin) {
    return NextResponse.json({
      email: target.email,
      isAdmin: false,
      promotedReplacement: null,
    });
  }

  // 3. 当前 admin 数
  const adminCount = await prisma.agent.count({ where: { isAdmin: true } });

  // 4. 唯一 admin → 必须提供 newAdminEmail
  if (adminCount === 1) {
    if (!newAdminEmail) {
      return apiError("LAST_ADMIN", {
        message: "这是系统唯一的 admin,demote 时必须在 body 中提供 newAdminEmail 来指定接班人。",
      });
    }
    // 不允许把 admin 转给自己
    if (newAdminEmail === target.email) {
      return apiError("VALIDATION_ERROR", {
        details: { newAdminEmail: "newAdminEmail 不能与被 demote 的 email 相同" },
      });
    }
    const replacement = await prisma.agent.findUnique({
      where: { email: newAdminEmail },
      select: { id: true, email: true, isAdmin: true },
    });
    if (!replacement) {
      return apiError("AGENT_NOT_FOUND", {
        message: `接班人 ${newAdminEmail} 不存在`,
      });
    }
    if (replacement.isAdmin) {
      return apiError("VALIDATION_ERROR", {
        details: { newAdminEmail: "接班人已经是 admin,无需重复提升" },
      });
    }

    // 原子事务:同时 demote + promote
    await prisma.$transaction([
      prisma.agent.update({
        where: { email: target.email },
        data: { isAdmin: false },
      }),
      prisma.agent.update({
        where: { email: replacement.email },
        data: { isAdmin: true },
      }),
    ]);

    return NextResponse.json({
      email: target.email,
      isAdmin: false,
      promotedReplacement: {
        email: replacement.email,
        isAdmin: true,
      },
    });
  }

  // 5. 还有其他 admin → 直接 demote
  await prisma.agent.update({
    where: { email: target.email },
    data: { isAdmin: false },
  });

  return NextResponse.json({
    email: target.email,
    isAdmin: false,
    promotedReplacement: null,
  });
});