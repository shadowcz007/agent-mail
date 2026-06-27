// /api/agents/[email]/apikey — Tier 3 Session
// POST 创建,GET 查看,DELETE 销毁(SPEC §3.1 / API §3.3-3.6)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { generateApiKey } from "@/lib/apiKey";

export const dynamic = "force-dynamic";

async function ensureSelf(email: string, sessionEmail: string): Promise<NextResponse | null> {
  if (decodeURIComponent(email) !== sessionEmail) {
    return apiError("FORBIDDEN", { details: { reason: "selfOnlyApiKey" } });
  }
  return null;
}

export const POST = withAuth<{ email: string }>("T3", async (_req, { params, auth }) => {
  const email = decodeURIComponent(params.email);
  const deny = await ensureSelf(email, auth.user.email);
  if (deny) return deny;

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: { apiKey: true },
  });
  if (!agent) return apiError("AGENT_NOT_FOUND");
  if (agent.apiKey) return apiError("APIKEY_EXISTS");

  const apiKey = generateApiKey();
  const now = new Date();
  await prisma.agent.update({
    where: { email },
    data: { apiKey, apiKeyCreatedAt: now },
  });

  return NextResponse.json({ apiKey, createdAt: now.toISOString() }, { status: 201 });
});

export const GET = withAuth<{ email: string }>("T3", async (_req, { params, auth }) => {
  const email = decodeURIComponent(params.email);
  const deny = await ensureSelf(email, auth.user.email);
  if (deny) return deny;

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: { apiKey: true, apiKeyCreatedAt: true, apiKeyLastUsedAt: true },
  });
  if (!agent) return apiError("AGENT_NOT_FOUND");

  return NextResponse.json({
    apiKey: agent.apiKey,
    createdAt: agent.apiKeyCreatedAt?.toISOString() ?? null,
    lastUsedAt: agent.apiKeyLastUsedAt?.toISOString() ?? null,
  });
});

export const DELETE = withAuth<{ email: string }>("T3", async (_req, { params, auth }) => {
  const email = decodeURIComponent(params.email);
  const deny = await ensureSelf(email, auth.user.email);
  if (deny) return deny;

  const agent = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (!agent) return apiError("AGENT_NOT_FOUND");

  await prisma.agent.update({
    where: { email },
    data: { apiKey: null, apiKeyCreatedAt: null, apiKeyLastUsedAt: null },
  });

  return new NextResponse(null, { status: 204 });
});
