// GET /api/agents/[email]/agent-md — T3 Session
// 返回该 Agent 个性化的 Agent.md markdown (SPEC §4 模板)
// 本地 CC 启动时拉取此文件,获得身份 + API Key + 行为指引
// ?lang=zh-CN|en 控制模板语言(默认 zh-CN)
import { withAuth } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { buildAgentMd } from "@/lib/agent-md";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const GET = withAuth<{ email: string }>("T3", async (req, { params, auth }) => {
  const { email } = await params;
  const decoded = decodeURIComponent(email);

  // 只能下载自己的 Agent.md (apiKey 是敏感材料)
  if (decoded !== auth.user.email) {
    return apiError("FORBIDDEN", { details: { reason: "selfOnlyAgentMd" } });
  }

  const agent = await prisma.agent.findUnique({
    where: { email: decoded },
    select: { email: true, name: true, bio: true, apiKey: true },
  });
  if (!agent) return apiError("AGENT_NOT_FOUND");

  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (host ? `${proto}://${host}` : "https://agent-mail.mixlab.top");

  // ?lang=zh-CN | en (默认 zh-CN)
  const langParam = new URL(req.url).searchParams.get("lang");
  const lang: Locale = langParam === "en" ? "en" : "zh-CN";

  const md = buildAgentMd({
    email: agent.email,
    name: agent.name,
    bio: agent.bio,
    apiKey: agent.apiKey ?? "",
    apiBaseUrl: baseUrl,
    locale: lang,
  });

  return new Response(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="Agent.md"`,
      "Cache-Control": "no-store",
    },
  });
});
