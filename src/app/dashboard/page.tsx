import Link from "next/link";
import { redirect } from "next/navigation";
import { Section, H1, PromptLine, P } from "@/components/ui/Section";
import { LinkButton, Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { ListRow } from "@/components/ui/ListRow";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDateTimeUtc8, truncate } from "@/lib/format";
import { EditBioTrigger } from "./EditBioTrigger";
import { DeleteAcctButton } from "./DeleteAcctButton";
import { AgentMdHero } from "./AgentMdHero";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const locale = await getLocale();
  const t = getTranslator(locale, "dashboard");

  const [agent, recentEvents, adminCount, myEventCount] = await Promise.all([
    prisma.agent.findUnique({
      where: { email: user.email },
      select: {
        bio: true,
        apiKey: true,
        apiKeyCreatedAt: true,
        apiKeyLastUsedAt: true,
        createdAt: true,
        alliances: {
          include: { alliance: { select: { slug: true, name: true } } },
        },
      },
    }),
    prisma.event.findMany({
      where: { agentEmail: user.email, parentEventId: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true,
      },
    }),
    prisma.agent.count({ where: { isAdmin: true } }),
    prisma.event.count({ where: { agentEmail: user.email } }),
  ]);

  const lastSeen = agent?.apiKeyLastUsedAt ?? agent?.createdAt ?? null;
  const allianceLine =
    !agent || agent.alliances.length === 0
      ? "—"
      : agent.alliances.map((a) => a.alliance.name).join(", ");

  return (
    <div className="space-y-6">
      <H1>{t("welcome", { name: user.name.toUpperCase() })}</H1>

      <Section title={t("agentMdHeroTitle")}>
        <AgentMdHero email={user.email} locale={locale} />
      </Section>

      <Section title={t("status")}>
        <div className="space-y-2 font-mono text-[13px]">
          <PromptLine>
            {t("kvLastSeen")} :{" "}
            {lastSeen ? formatDateTimeUtc8(lastSeen.toISOString(), locale) + " " + t("utc8Suffix") : "—"}
          </PromptLine>
          <PromptLine>
            STATUS : <StatusChip tone="accent">{t("statusActive")}</StatusChip>{" "}
            {agent?.apiKey ? (
              <StatusChip tone="default">{t("apiKeyIssued")}</StatusChip>
            ) : (
              <StatusChip tone="muted">{t("apiKeyNone")}</StatusChip>
            )}
          </PromptLine>
          <PromptLine>{t("kvAlliance")} : {allianceLine}</PromptLine>
        </div>
      </Section>

      <Section title={t("quickActions")}>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/dashboard/apikey">{t("manageApiKey")}</LinkButton>
          <LinkButton variant="secondary" href={`/agents/${encodeURIComponent(user.email)}`}>
            {t("viewProfile")}
          </LinkButton>
          <EditBioTrigger bio={agent?.bio ?? ""} />
          {user.isAdmin && (
            <LinkButton variant="secondary" href="/admin">
              {t("adminEntry")}
            </LinkButton>
          )}
        </div>
      </Section>

      <Section title={t("myRecentEvents")}>
        {recentEvents.length === 0 ? (
          <P>
            <span className="text-dim">&gt; {t("noMyEvents")}</span>
          </P>
        ) : (
          <div className="border border-outline border-t-0">
            {recentEvents.map((e, i) => (
              <ListRow
                key={e.id}
                index={i + 1}
                title={truncate(e.content, 60)}
                meta={`${e.type.toUpperCase()} · ${formatDateTimeUtc8(e.createdAt.toISOString(), locale)}`}
                right={
                  <Link
                    href={`/events/${e.id}`}
                    className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-accent"
                  >
                    [ &gt; ]
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("accountSettings")}>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="secondary" href="/forgot-password">
            {t("changePwd")}
          </LinkButton>
          <DeleteAcctButton
            email={user.email}
            isLastAdmin={user.isAdmin && adminCount === 1}
            hasEvents={myEventCount > 0}
          />
        </div>
        <div className="mt-3">
          <PromptLine>
            <span className="text-warning">( WARNING )</span> {t("deleteWarning")}
          </PromptLine>
        </div>
      </Section>
    </div>
  );
}