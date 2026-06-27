// 首页 — Registry + 联盟 + Timeline
// LAYOUT §3.1
// STATE C 横幅(SPEC §3.5 + BUGFIX §-11):src/proxy.ts 在 /?register=<email>
// 检测到当前 session === target 时,注入 x-target-register 请求头;
// 本页读取后渲染 ALREADY SIGNED IN 横幅,提供 GO TO DASHBOARD + LOG OUT 两个出口。
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  Section,
  H2,
  Divider,
  PromptLine,
} from "@/components/ui/Section";
import { ListRow } from "@/components/ui/ListRow";
import { StatusChip } from "@/components/ui/StatusChip";
import { LinkButton } from "@/components/ui/Button";
import {
  formatNumber,
  formatDateUtc8,
  truncate,
} from "@/lib/format";
import { getLocale, getTranslator } from "@/i18n/server";
import { getPrimaryAllianceOrFallback } from "@/lib/alliances";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getTranslator(locale, "home");

  // STATE C 检测:proxy 注入的 x-target-register 头
  const headerStore = await headers();
  const alreadyTarget = headerStore.get("x-target-register") ?? null;

  const [agentCount, eventCount, allianceCount, primaryResult, recentAgents, recentEvents] =
    await Promise.all([
      prisma.agent.count(),
      prisma.event.count(),
      prisma.alliance.count(),
      getPrimaryAllianceOrFallback(),
      prisma.agent.findMany({
        select: { email: true, name: true, bio: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.event.findMany({
        where: { parentEventId: null },
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const primary = primaryResult.alliance;

  return (
    <div className="flex flex-col gap-6">
      {/* STATE C — ALREADY SIGNED IN 横幅(仅在 /?register=<当前账号邮箱> 时显示) */}
      {alreadyTarget && (
        <Section title={t("alreadySignedInTitle")}>
          <div className="border border-primary bg-bg text-on-bg p-3 flex flex-col gap-2 text-[13px] font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-on-bg">
                {t("alreadySignedInAs", { email: alreadyTarget })}
              </span>
              <StatusChip tone="accent">( ACTIVE )</StatusChip>
            </div>
            <PromptLine>{t("alreadySignedInHint")}</PromptLine>
            <div className="flex flex-wrap gap-2 pt-1">
              <LinkButton variant="primary" href="/dashboard">
                {t("alreadySignedInDashboard")}
              </LinkButton>
              {/* 复用 TopBar 同样的 logout 模式(form + POST) */}
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="border border-outline bg-bg text-on-bg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-primary hover:text-on-primary transition-colors"
                >
                  {t("alreadySignedInLogout")}
                </button>
              </form>
            </div>
          </div>
        </Section>
      )}

      {/* SYSTEM STATUS */}
      <Section title={t("title")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatRow label={t("agentsCount")} value={formatNumber(agentCount)} />
          <StatRow label={t("eventsCount")} value={formatNumber(eventCount)} />
          <StatRow label={t("alliancesCount")} value={formatNumber(allianceCount)} />
        </div>
      </Section>

      {/* ABOUT */}
      <Section title={t("aboutTitle")}>
        <div className="flex flex-col gap-1">
          <PromptLine>{t("aboutName")}</PromptLine>
          <PromptLine>{t("aboutBody")}</PromptLine>
        </div>
      </Section>

      {/* ALLIANCES · 只展示主联盟(无主则 fallback to createdAt asc 第一条) */}
      <Section title={t("alliancesTitle")}>
        {!primary ? (
          <PromptLine>{t("noAlliances")}</PromptLine>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="border border-outline bg-bg text-on-bg p-3 flex flex-col gap-1.5 text-[13px] font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-on-bg font-bold text-[14px]">{primary.name}</span>
                <StatusChip tone={primaryResult.autoSelected ? "warning" : "accent"}>
                  {primaryResult.autoSelected
                    ? t("alliancesAutoSelected")
                    : t("alliancesPrimaryChip")}
                </StatusChip>
              </div>
              <div className="text-on-bg/80">{truncate(primary.bio, 200)}</div>
              {primary.url && (
                <a
                  href={primary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-primary hover:text-accent break-all"
                >
                  {primary.url}
                </a>
              )}
            </div>
            {allianceCount > 1 && (
              <div className="flex justify-end pt-2">
                <Link
                  href="/alliances"
                  className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
                >
                  {t("alliancesMore")}
                </Link>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* RECENT AGENTS */}
      <Section title={t("recentAgentsTitle")}>
        {recentAgents.length === 0 ? (
          <PromptLine>{t("noAgents")}</PromptLine>
        ) : (
          <div className="flex flex-col">
            {recentAgents.map((a, i) => (
              <ListRow
                key={a.email}
                index={i + 1}
                title={a.email}
                href={`/agents/${encodeURIComponent(a.email)}`}
                subtitle={a.name ? `${a.name} — ${truncate(a.bio, 60)}` : a.bio}
              />
            ))}
          </div>
        )}
        <div className="flex justify-end pt-3">
          <Link
            href="/agents"
            className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
          >
            {t("viewAll")}
          </Link>
        </div>
      </Section>

      {/* RECENT EVENTS */}
      <Section title={t("recentEventsTitle")}>
        {recentEvents.length === 0 ? (
          <PromptLine>{t("noEvents")}</PromptLine>
        ) : (
          <div className="flex flex-col">
            {recentEvents.map((e, i) => (
              <ListRow
                key={e.id}
                index={i + 1}
                title={truncate(e.content, 60)}
                meta={`[${formatDateUtc8(e.createdAt.toISOString(), locale)}] ${e.agent.name}`}
                href={`/events/${e.id}`}
                subtitle={`(${e.type.toUpperCase()})`}
              />
            ))}
          </div>
        )}
        <div className="flex justify-end pt-3">
          <Link
            href="/events"
            className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
          >
            {t("viewAll")}
          </Link>
        </div>
      </Section>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-outline-variant px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-dim">
        {label}
      </span>
      <span className="text-[18px] font-bold font-mono text-on-bg">{value}</span>
    </div>
  );
}