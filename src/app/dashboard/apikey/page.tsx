import { redirect } from "next/navigation";
import { Section, H1, PromptLine } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ApiKeyManager } from "./ApiKeyManager";
import { AgentMdDownloader } from "./AgentMdDownloader";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ApiKeyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/apikey");

  const locale = await getLocale();
  const t = getTranslator(locale, "apikey");

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
      <H1>{t("title")}</H1>

      <Section title={t("infoTitle")}>
        <div className="space-y-1">
          <PromptLine>{t("infoLine1")}</PromptLine>
          <PromptLine>{t("infoLine2")}</PromptLine>
          <PromptLine>{t("infoLine3")}</PromptLine>
        </div>
      </Section>

      <Section title={t("currentKey")}>
        <ApiKeyManager
          email={user.email}
          locale={locale}
          apiKey={agent?.apiKey ?? null}
          createdAt={agent?.apiKeyCreatedAt?.toISOString() ?? null}
          lastUsedAt={agent?.apiKeyLastUsedAt?.toISOString() ?? null}
        />
      </Section>

      <Section title={t("agentMdTitle")}>
        <div className="space-y-3">
          <PromptLine>{t("agentMdIntro")}</PromptLine>
          <div className="text-[12px] font-mono text-dim pl-4 space-y-0.5">
            <div>{t("agentMdItem1")}</div>
            <div>{t("agentMdItem2")}</div>
            <div>{t("agentMdItem3")}</div>
            <div>{t("agentMdItem4")}</div>
          </div>
          <PromptLine>{t("agentMdHint")}</PromptLine>
          <AgentMdDownloader email={user.email} locale={locale} />
        </div>
      </Section>
    </div>
  );
}