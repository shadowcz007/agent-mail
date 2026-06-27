// /api/admin/agents/[email]/alliances — Tier 4 Admin
// GET 列出 / POST 加入(API §4.3.1-4.3.2)
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const JoinSchema = z.object({ slug: z.string().min(1) });

export const GET = withAuth<{ email: string }>("T4", async (_req, { params }) => {
  const email = decodeURIComponent(params.email);
  const agent = await prisma.agent.findUnique({
    where: { email },
    select: {
      email: true,
      alliances: {
        select: {
          joinedAt: true,
          alliance: { select: { slug: true, name: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!agent) return apiError("AGENT_NOT_FOUND");

  return NextResponse.json({
    email: agent.email,
    alliances: agent.alliances.map((aa) => ({
      slug: aa.alliance.slug,
      name: aa.alliance.name,
      joinedAt: aa.joinedAt.toISOString(),
    })),
  });
});

export const POST = withAuth<{ email: string }>("T4", async (req: NextRequest, { params }) => {
  const email = decodeURIComponent(params.email);
  const body = await req.json().catch(() => ({}));
  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { slug } = parsed.data;

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!agent) return apiError("AGENT_NOT_FOUND");

  const alliance = await prisma.alliance.findUnique({
    where: { slug },
    select: { slug: true },
  });
  if (!alliance) return apiError("ALLIANCE_NOT_FOUND");

  const existing = await prisma.agentAlliance.findUnique({
    where: { agentId_allianceSlug: { agentId: agent.id, allianceSlug: slug } },
  });
  let joinedAt: Date;
  if (existing) {
    joinedAt = existing.joinedAt;
  } else {
    const created = await prisma.agentAlliance.create({
      data: { agentId: agent.id, allianceSlug: slug },
      select: { joinedAt: true },
    });
    joinedAt = created.joinedAt;
  }

  return NextResponse.json(
    {
      agentEmail: email,
      allianceSlug: slug,
      joinedAt: joinedAt.toISOString(),
    },
    { status: 201 }
  );
});
