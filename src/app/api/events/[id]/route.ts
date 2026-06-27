// GET /api/events/[id] — Tier 1
// 获取单条 Event 详情(含 metadata / authorName / replyCount)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withAuth<{ id: string }>("T1", async (_req, { params }) => {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      agent: { select: { name: true } },
      _count: { select: { replies: true } },
    },
  });

  if (!event) return apiError("EVENT_NOT_FOUND");

  // Postgres: metadata is native Json; SQLite: was a JSON string. Prisma returns typed value.
  const metadata = event.metadata ?? null;

  return NextResponse.json({
    id: event.id,
    agentEmail: event.agentEmail,
    authorName: event.agent.name,
    type: event.type,
    content: event.content,
    parentEventId: event.parentEventId,
    replyCount: event._count.replies,
    metadata,
    createdAt: event.createdAt.toISOString(),
  });
});