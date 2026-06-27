import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateUtc8 } from "@/lib/format";
import { AddAllianceForm, RemoveAllianceButton } from "./actions";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ email: string }>;
}

export default async function AgentAlliancesPage({ params }: PageProps) {
  const user = await getCurrentUser();

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");

  if (!user || !user.isAdmin) return <AccessDenied t={t} />;

  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);

  const agent = await prisma.agent.findUnique({
    where: { email: decodedEmail },
    select: {
      email: true,
      name: true,
      createdAt: true,
      alliances: {
        include: { alliance: { select: { slug: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!agent) {
    return (
      <Section title={t("agentNotFound")}>
        <PromptLine>{t("agentNotFoundBody", { email: decodedEmail })}</PromptLine>
        <PromptLine>
          &gt; <Link href="/admin/agents" className="underline">{t("backToAgentList")}</Link>
        </PromptLine>
      </Section>
    );
  }

  const allAlliances = await prisma.alliance.findMany({
    select: { slug: true, name: true },
    orderBy: { slug: "asc" },
  });
  const joined = new Set(agent.alliances.map((aa) => aa.alliance.slug));
  const available = allAlliances.filter((a) => !joined.has(a.slug));

  return (
    <div className="space-y-6">
      <H1>{t("manageAlliancesTitle")}</H1>

      <Section title="AGENT">
        <div className="space-y-1">
          <PromptLine>{t("agentKvEmail")} : {agent.email}</PromptLine>
          <PromptLine>{t("agentKvName")} : {agent.name}</PromptLine>
          <PromptLine>{t("agentKvJoined")} : {formatDateUtc8(agent.createdAt.toISOString(), locale)}</PromptLine>
        </div>
      </Section>

      <Section title={t("addToAlliance")}>
        {available.length === 0 ? (
          <PromptLine>{t("allAlliancesJoined")}</PromptLine>
        ) : (
          <AddAllianceForm email={agent.email} available={available} />
        )}
      </Section>

      <Section title={t("currentAlliances")}>
        {agent.alliances.length === 0 ? (
          <PromptLine>{t("noCurrentAlliances")}</PromptLine>
        ) : (
          <div className="border border-outline">
            {agent.alliances.map((aa, i) => (
              <div
                key={aa.alliance.slug}
                className="px-3 py-3 border-b border-outline-variant last:border-b-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                      [ {String(i + 1).padStart(2, "0")} ]
                    </span>
                    <span className="text-[13px] font-mono text-on-bg truncate">
                      {aa.alliance.slug}
                    </span>
                  </div>
                  <div className="mt-1 pl-11 text-[11px] font-mono space-y-0.5">
                    <div><span className="text-dim">NAME</span> : {aa.alliance.name}</div>
                    <div><span className="text-dim">JOINED</span> : {formatDateUtc8(aa.joinedAt.toISOString(), locale)}</div>
                  </div>
                </div>
                <RemoveAllianceButton email={agent.email} slug={aa.alliance.slug} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Divider />

      <div className="flex gap-2">
        <LinkButton variant="secondary" href="/admin/agents">
          {t("backToAgentList")}
        </LinkButton>
      </div>

      <PromptLine><StatusChip tone="warning">NOTE</StatusChip> {t("allianceNote")}</PromptLine>
    </div>
  );
}

function AccessDenied({ t }: { t: ReturnType<typeof getTranslator> }) {
  return (
    <Section title={t("accessDenied")}>
      <PromptLine>{t("accessDeniedBody")}</PromptLine>
      <PromptLine>
        &gt; <Link href="/admin" className="underline">{t("accessDeniedBack")}</Link>
      </PromptLine>
    </Section>
  );
}