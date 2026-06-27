// GET /api/admin/agents/[email] — Tier 4 Admin
// 单个 Agent 完整详情(供 /admin/agents/[email] 详情页使用)
//
// DELETE /api/admin/agents/[email] — Tier 4 Admin
// 永久删除任意 Agent 账户(管理员专用)。
// !!! 当前 schema Event.agent 是 onDelete: Cascade — 删 agent 会同时删其所有 events;
// !!! AgentAlliance.agentId 也是 Cascade — 关联也会一并清理。
// 约束:
//   - 唯一 admin 保护:若 target 是最后一个 admin → 409 LAST_ADMIN(必须先 promote 其他人)
//   - admin 不能删自己 → 403 FORBIDDEN(防止误锁)
// 成功后:返回 200 { ok: true, deletedEmail }
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withAuth<{ email: string }>(
  "T4",
  async (_req, { params }) => {
    const email = decodeURIComponent(params.email);
    const agent = await prisma.agent.findUnique({
      where: { email },
      select: {
        email: true,
        name: true,
        bio: true,
        isAdmin: true,
        apiKey: true,
        apiKeyCreatedAt: true,
        apiKeyLastUsedAt: true,
        createdAt: true,
        alliances: {
          include: {
            alliance: { select: { slug: true, name: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { events: true } },
      },
    });
    if (!agent) return apiError("AGENT_NOT_FOUND");
    return NextResponse.json({
      email: agent.email,
      name: agent.name,
      bio: agent.bio,
      isAdmin: agent.isAdmin,
      apiKeyIssued: !!agent.apiKey,
      apiKeyCreatedAt: agent.apiKeyCreatedAt?.toISOString() ?? null,
      apiKeyLastUsedAt: agent.apiKeyLastUsedAt?.toISOString() ?? null,
      createdAt: agent.createdAt.toISOString(),
      alliances: agent.alliances.map((aa) => ({
        slug: aa.alliance.slug,
        name: aa.alliance.name,
      })),
      eventCount: agent._count.events,
    });
  }
);

export const DELETE = withAuth<{ email: string }>(
  "T4",
  async (_req, { params, auth }) => {
    const email = decodeURIComponent(params.email);

    // 1. 不能删自己(防止 admin 误锁系统)
    if (email === auth.user.email) {
      return apiError("FORBIDDEN", { details: { reason: "selfOnlyDelete" } });
    }

    // 2. 查目标
    const target = await prisma.agent.findUnique({
      where: { email },
      select: { id: true, email: true, isAdmin: true },
    });
    if (!target) return apiError("AGENT_NOT_FOUND");

    // 3. 唯一 admin 保护(同 demote 逻辑)
    if (target.isAdmin) {
      const adminCount = await prisma.agent.count({ where: { isAdmin: true } });
      if (adminCount === 1) {
        return apiError("LAST_ADMIN", {
          details: { reason: "lastAdminDelete" },
        });
      }
    }

    // 4. 删 Agent(Prisma cascade 清掉 AgentAlliance + Event + PasswordResetToken)
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { agentEmail: email } }),
      prisma.agent.delete({ where: { id: target.id } }),
    ]);

    return NextResponse.json({ ok: true, deletedEmail: target.email });
  }
);
