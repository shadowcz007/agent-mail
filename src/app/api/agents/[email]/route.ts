// /api/agents/[email] — Tier 1 / Tier 3
// GET — 公开主页
// DELETE — T3 Session,永久删除当前 session 对应的 agent 账户。
//   ⚠️ 当前 schema Event.agent 是 onDelete: Cascade — 删 agent 会同时删其所有 events。
//   约束:
//     - 只能删除自己(其他 email → 403 FORBIDDEN)
//     - 如果是最后一个 admin 且 isAdmin → 409 LAST_ADMIN(必须先 demote 或 transfer)
//   成功后:清除 session cookie + 303 重定向到 /
import { NextRequest, NextResponse } from "next/server";
import { withAuth, clearSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withAuth<{ email: string }>("T1", async (_req, { params }) => {
  const email = decodeURIComponent(params.email);

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      bio: true,
      apiKey: true,
      createdAt: true,
      alliances: {
        select: {
          alliance: { select: { slug: true, name: true } },
        },
      },
    },
  });

  if (!agent) {
    return apiError("AGENT_NOT_FOUND");
  }

  return NextResponse.json({
    email: agent.email,
    name: agent.name,
    bio: agent.bio,
    alliances: agent.alliances.map((aa) => ({
      slug: aa.alliance.slug,
      name: aa.alliance.name,
    })),
    createdAt: agent.createdAt.toISOString(),
    apiKeyIssued: !!agent.apiKey,
  });
});

export const DELETE = withAuth<{ email: string }>(
  "T3",
  async (req: NextRequest, { params, auth }) => {
    const email = decodeURIComponent(params.email);

    // 只能删除自己
    if (email !== auth.user.email) {
      return apiError("FORBIDDEN", { message: "只能删除自己的账户" });
    }

    // 查目标
    const target = await prisma.agent.findUnique({
      where: { email },
      select: { id: true, email: true, isAdmin: true },
    });
    if (!target) return apiError("AGENT_NOT_FOUND");

    // 唯一 admin 约束(同 demote 逻辑)
    if (target.isAdmin) {
      const adminCount = await prisma.agent.count({ where: { isAdmin: true } });
      if (adminCount === 1) {
        return apiError("LAST_ADMIN", {
          message:
            "你是系统唯一的 admin。删除前必须先把 admin 身份转交给另一个 Agent(在 /admin/agents)。",
        });
      }
    }

    // 删 Agent(Prisma cascade 会清掉 AgentAlliance + Event)
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { agentEmail: email } }),
      prisma.agent.delete({ where: { id: target.id } }),
    ]);

    // 清除当前 session cookie + 303 跳转
    const cleared = await clearSessionCookie();
    return NextResponse.redirect(new URL("/", req.url), {
      status: 303,
      headers: cleared.headers,
    });
  }
);