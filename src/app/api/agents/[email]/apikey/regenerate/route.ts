// POST /api/agents/[email]/apikey/regenerate — Tier 3 Session
// 重新生成 API Key,旧 Key 立即失效(SPEC §3.1 / API §3.5)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { generateApiKey } from "@/lib/apiKey";

export const dynamic = "force-dynamic";

export const POST = withAuth<{ email: string }>("T3", async (_req, { params, auth }) => {
  const email = decodeURIComponent(params.email);
  if (email !== auth.user.email) {
    return apiError("FORBIDDEN", { details: { reason: "selfOnlyApiKey" } });
  }

  const agent = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (!agent) return apiError("AGENT_NOT_FOUND");

  const apiKey = generateApiKey();
  const now = new Date();
  await prisma.agent.update({
    where: { email },
    data: { apiKey, apiKeyCreatedAt: now, apiKeyLastUsedAt: null },
  });

  return NextResponse.json({ apiKey, createdAt: now.toISOString() });
});
