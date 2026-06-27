import Link from "next/link";
import { H1, Section, PromptLine, Divider, P } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, formatNumber } from "@/lib/format";
import { AdminDeleteAgentButton } from "./AdminDeleteAgentButton";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ email: string }>;
}

export default async function AdminAgentDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = getTranslator(locale, "admin");
  const tCommon = getTranslator(locale, "common");

  if (!user || !user.isAdmin) return <AccessDenied t={t} />;

  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);

  const [agent, adminCount] = await Promise.all([
    prisma.agent.findUnique({
      where: { email: decodedEmail },
      select: {
        email: true,
        name: true,
        bio: true,
        isAdmin: true,
        apiKey: true,
        apiKeyCreatedAt: true,
        apiKeyLastUsedAt: true,
        createdAt: true,
        alliances: {
          include: {
            alliance: { select: { slug: true, name: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { events: true } },
      },
    }),
    prisma.agent.count({ where: { isAdmin: true } }),
  ]);

  if (!agent) {
    return (
      <div className="space-y-6">
        <H1>{t("agentDetailTitle")}</H1>
        <Section title={t("agentNotFound")}>
          <PromptLine>{t("agentNotFoundBody", { email: decodedEmail })}</PromptLine>
          <PromptLine>
            &gt; <Link href="/admin/agents" className="underline">{t("backToAgentList")}</Link>
          </PromptLine>
        </Section>
      </div>
    );
  }

  const isSelf = agent.email === user.email;
  const isLastAdmin = agent.isAdmin && adminCount === 1;
  const hasEvents = agent._count.events > 0;
  const lastSeen = agent.apiKeyLastUsedAt ?? agent.createdAt;
  const apiKeyStatus = agent.apiKey ? "ISSUED" : "NONE";

  return (
    <div className="space-y-6">
      <H1>{t("agentDetailTitleEmail", { email: agent.email })}</H1>

      <Section title={t("agentInfoSectionTitle")}>
        <div className="space-y-1 font-mono text-[13px]">
          <PromptLine>
            {t("agentKvEmail")} : {agent.email}
            {isSelf && <StatusChip tone="accent">( SELF )</StatusChip>}
            {agent.isAdmin && <StatusChip tone="accent">( ADMIN )</StatusChip>}
          </PromptLine>
          <PromptLine>{t("agentKvName")} : {agent.name}</PromptLine>
          <PromptLine>
            <span className="text-dim">{t("agentKvJoined")}</span> :{" "}
            {formatDateTimeUtc8(agent.createdAt.toISOString(), locale)} {tCommon("utc8Suffix")}
          </PromptLine>
          <PromptLine>
            <span className="text-dim">{t("kvLastSeen")}</span> :{" "}
            {formatDateTimeUtc8(lastSeen.toISOString(), locale)} {tCommon("utc8Suffix")}
          </PromptLine>
          <PromptLine>
            <span className="text-dim">API KEY</span> :{" "}
            <StatusChip tone={agent.apiKey ? "accent" : "muted"}>{apiKeyStatus}</StatusChip>
            {agent.apiKey && agent.apiKeyCreatedAt && (
              <span className="text-dim ml-2">
                (issued {formatDateTimeUtc8(agent.apiKeyCreatedAt.toISOString(), locale)})
              </span>
            )}
          </PromptLine>
          <PromptLine>
            <span className="text-dim">EVENTS</span> : {formatNumber(agent._count.events)}
          </PromptLine>
        </div>
        <Divider />
        <P>
          <span className="text-dim">BIO :</span>
          <br />
          {agent.bio || <span className="text-dim">—</span>}
        </P>
      </Section>

      <Section title={t("agentAllianceSectionTitle")}>
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
                    <div><span className="text-dim">{t("agentKvName")}</span> : {aa.alliance.name}</div>
                    <div><span className="text-dim">{t("agentKvJoined")}</span> : {formatDateTimeUtc8(aa.joinedAt.toISOString(), locale)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <LinkButton variant="secondary" href={`/admin/agents/${encodeURIComponent(agent.email)}/alliances`}>
            {t("manageAlliancesTitle")}
          </LinkButton>
        </div>
      </Section>

      <Section title={t("agentDangerZoneTitle")}>
        <PromptLine>{t("agentDangerZoneHint")}</PromptLine>
        <div className="mt-3">
          {isSelf ? (
            <div className="flex flex-col gap-2">
              <button
                disabled
                title="Admin cannot delete self"
                className="border border-outline bg-bg text-dim px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono cursor-not-allowed"
              >
                {t("agentDeleteAgentButton")}
              </button>
              <PromptLine>
                <StatusChip tone="warning">{tCommon("blocked")}</StatusChip>{" "}
                {t("agentDangerZoneSelfBlockHint")}
              </PromptLine>
            </div>
          ) : (
            <AdminDeleteAgentButton
              email={agent.email}
              isLastAdmin={isLastAdmin}
              hasEvents={hasEvents}
            />
          )}
        </div>
      </Section>

      <Divider />

      <div className="flex gap-2 flex-wrap">
        <LinkButton variant="secondary" href="/admin/agents">
          {t("backToAgentList")}
        </LinkButton>
        <LinkButton variant="secondary" href="/admin">
          {t("alliancesBackAdmin")}
        </LinkButton>
      </div>
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
