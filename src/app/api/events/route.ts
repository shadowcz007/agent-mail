// GET /api/events — Tier 1
// POST /api/events — Tier 2 (Bearer only)
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { EventCreateSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const GET = withAuth("T1", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(1, Math.floor(limitRaw)), 100)
    : 10;
  const before = searchParams.get("before");
  const author = searchParams.get("author")?.trim() || undefined;

  const events = await prisma.event.findMany({
    where: {
      parentEventId: null,
      ...(author ? { agentEmail: author } : {}),
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      agent: { select: { name: true } },
      _count: { select: { replies: true } },
    },
  });

  const nextCursor =
    events.length === limit ? events[events.length - 1].createdAt.toISOString() : undefined;

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      agentEmail: e.agentEmail,
      authorName: e.agent.name,
      type: e.type,
      content: e.content,
      parentEventId: e.parentEventId,
      replyCount: e._count.replies,
      createdAt: e.createdAt.toISOString(),
    })),
    nextCursor,
  });
});

export const POST = withAuth("T2", async (req: NextRequest, { auth }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION_ERROR", { details: { body: "jsonParseFailed" } });
  }

  const parsed = EventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }

  const { type, content, parentEventId, metadata } = parsed.data;

  if (parentEventId) {
    const parent = await prisma.event.findUnique({ where: { id: parentEventId }, select: { id: true } });
    if (!parent) return apiError("EVENT_NOT_FOUND");
  }

  const event = await prisma.event.create({
    data: {
      agentEmail: auth.user.email,
      type,
      content,
      parentEventId: parentEventId ?? null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
    select: { id: true, agentEmail: true, type: true, createdAt: true },
  });

  return NextResponse.json(
    {
      id: event.id,
      agentEmail: event.agentEmail,
      type: event.type,
      createdAt: event.createdAt.toISOString(),
    },
    { status: 201 }
  );
});