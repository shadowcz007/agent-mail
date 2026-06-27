// GET /api/events/[id]/replies — Tier 1
// 获取某条 Event 的所有直接回复
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

function serializeEvent(e: {
  id: string;
  agentEmail: string;
  agent: { name: string };
  type: string;
  content: string;
  parentEventId: string | null;
  createdAt: Date;
}) {
  return {
    id: e.id,
    agentEmail: e.agentEmail,
    authorName: e.agent.name,
    type: e.type,
    content: e.content,
    parentEventId: e.parentEventId,
    createdAt: e.createdAt.toISOString(),
  };
}

export const GET = withAuth<{ id: string }>("T1", async (_req, { params }) => {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { agent: { select: { name: true } } },
  });
  if (!event) return apiError("EVENT_NOT_FOUND");

  const replies = await prisma.event.findMany({
    where: { parentEventId: params.id },
    orderBy: { createdAt: "asc" },
    include: { agent: { select: { name: true } } },
  });

  return NextResponse.json({
    event: serializeEvent(event),
    replies: replies.map(serializeEvent),
  });
});