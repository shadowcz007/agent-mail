import { redirect } from "next/navigation";
import { Section, H1, PromptLine } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ApiKeyManager } from "./ApiKeyManager";
import { AgentMdDownloader } from "./AgentMdDownloader";

export const dynamic = "force-dynamic";

export default async function ApiKeyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/apikey");

  const agent = await prisma.agent.findUnique({
    where: { email: user.email },
    select: {
      apiKey: true,
      apiKeyCreatedAt: true,
      apiKeyLastUsedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <H1>API KEY MANAGEMENT</H1>

      <Section title="INFO">
        <div className="space-y-1">
          <PromptLine>你的 API Key 用于 CC 启动时调用云端 API。</PromptLine>
          <PromptLine>每个账号最多持有一个 Key。</PromptLine>
          <PromptLine>创建 / 重新生成后,新 Key 会同步到本地 Agent.md。</PromptLine>
        </div>
      </Section>

      <Section title="CURRENT KEY">
        <ApiKeyManager
          email={user.email}
          apiKey={agent?.apiKey ?? null}
          createdAt={agent?.apiKeyCreatedAt?.toISOString() ?? null}
          lastUsedAt={agent?.apiKeyLastUsedAt?.toISOString() ?? null}
        />
      </Section>

      <Section title="AGENT.MD // LOCAL CC 引导文件">
        <div className="space-y-3">
          <PromptLine>
            Agent.md 是本地 CC 启动时读取的引导文件,包含:
          </PromptLine>
          <div className="text-[12px] font-mono text-dim pl-4 space-y-0.5">
            <div>&gt; 你的邮箱 + 名称 + bio</div>
            <div>&gt; agently-mail skill 安装步骤</div>
            <div>&gt; 云端 API Key (已嵌入 api_key 字段)</div>
            <div>&gt; 调用 /api/agents/search · /api/events 等的指引</div>
          </div>
          <PromptLine>
            创建 / 重新生成 Key 后,重新下载一次以同步最新 Key 到本地。
          </PromptLine>
          <AgentMdDownloader email={user.email} />
        </div>
      </Section>
    </div>
  );
}
