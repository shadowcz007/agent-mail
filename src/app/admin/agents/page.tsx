import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Input } from "@/components/ui/Input";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateUtc8, formatNumber } from "@/lib/format";
import type { Prisma } from "@prisma/client";
import { DemoteButton } from "./DemoteButton";
import { PromoteButton } from "./PromoteButton";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    alliance?: string;
    isAdmin?: string;
    withApiKey?: string;
  }>;
}

export default async function AdminAgentsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");
  const tAgents = getTranslator(locale, "agents");

  if (!user || !user.isAdmin) return <AccessDenied t={t} />;

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const alliance = sp.alliance?.trim() ?? "";
  const isAdminRaw = sp.isAdmin ?? "";
  const withApiKeyRaw = sp.withApiKey ?? "";

  const where: Prisma.AgentWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { bio: { contains: q } },
    ];
  }
  if (isAdminRaw === "true") where.isAdmin = true;
  else if (isAdminRaw === "false") where.isAdmin = false;
  if (withApiKeyRaw === "true") where.apiKey = { not: null };
  else if (withApiKeyRaw === "false") where.apiKey = null;
  if (alliance) {
    where.alliances = { some: { alliance: { slug: alliance } } };
  }

  const [agents, total, totalAdmins, totalWithKey] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        alliances: {
          include: { alliance: { select: { slug: true, name: true } } },
        },
        _count: { select: { events: true } },
      },
    }),
    prisma.agent.count({ where }),
    prisma.agent.count({ where: { ...where, isAdmin: true } }),
    prisma.agent.count({ where: { ...where, apiKey: { not: null } } }),
  ]);

  const filterBase = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (alliance) params.set("alliance", alliance);
    if (isAdminRaw) params.set("isAdmin", isAdminRaw);
    if (withApiKeyRaw) params.set("withApiKey", withApiKeyRaw);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div className="space-y-6">
      <H1>{t("agentsTitle")}</H1>

      <Section title={t("agentsTitleCount", { n: formatNumber(total) })}>
        <form method="GET" className="space-y-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg block mb-1">
                {t("agentsSearchLabel")}
              </label>
              <Input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t("agentsSearchPlaceholder")}
              />
            </div>
            {alliance && (
              <input type="hidden" name="alliance" value={alliance} />
            )}
            {isAdminRaw && (
              <input type="hidden" name="isAdmin" value={isAdminRaw} />
            )}
            {withApiKeyRaw && (
              <input type="hidden" name="withApiKey" value={withApiKeyRaw} />
            )}
            <button
              type="submit"
              className="border border-primary bg-primary text-on-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-accent hover:text-on-accent transition-colors"
            >
              {t("agentsSearchSubmit")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">{t("agentsFilterLabel")}</span>
            <LinkButton variant={!isAdminRaw && !withApiKeyRaw ? "primary" : "secondary"} href={filterBase({ isAdmin: undefined, withApiKey: undefined })}>
              {t("agentsFilterAll", { n: formatNumber(total) })}
            </LinkButton>
            <LinkButton variant={isAdminRaw === "true" ? "primary" : "secondary"} href={filterBase({ isAdmin: "true" })}>
              [ {t("agentsFilterAdmin")} ({formatNumber(totalAdmins)}) ]
            </LinkButton>
            <LinkButton variant={withApiKeyRaw === "true" ? "primary" : "secondary"} href={filterBase({ withApiKey: "true" })}>
              [ {t("agentsFilterWithKey")} ({formatNumber(totalWithKey)}) ]
            </LinkButton>
          </div>
        </form>

        <div className="border-t border-dashed border-outline my-3" />

        {agents.length === 0 ? (
          <PromptLine>{t("agentsNoMatches")}</PromptLine>
        ) : (
          <div className="border border-outline">
            {agents.map((a, i) => {
              const allianceSlugs = a.alliances.map((aa) => aa.alliance.slug).join(", ") || "—";
              return (
                <div
                  key={a.id}
                  className="px-3 py-3 border-b border-outline-variant last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                        [ {String(i + 1).padStart(2, "0")} ]
                      </span>
                      <span className="text-[13px] font-mono text-on-bg truncate">{a.email}</span>
                      {a.isAdmin && <StatusChip tone="accent">{t("colAdmin")}</StatusChip>}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 pl-11 text-[11px] font-mono">
                    <div><span className="text-dim">{t("colName")}</span> : {a.name}</div>
                    <div><span className="text-dim">{t("colJoined")}</span> : {formatDateUtc8(a.createdAt.toISOString(), locale)}</div>
                    <div><span className="text-dim">{t("colAlliances")}</span> : {allianceSlugs}</div>
                    <div>
                      <span className="text-dim">{t("colApiKey")}</span> :{" "}
                      <StatusChip tone={a.apiKey ? "accent" : "muted"}>
                        {a.apiKey ? t("apiKeyIssued") : t("apiKeyNone")}
                      </StatusChip>
                    </div>
                    <div><span className="text-dim">{t("colEvents")}</span> : {formatNumber(a._count.events)}</div>
                  </div>
                  <div className="mt-2 pl-11 flex flex-wrap gap-2">
                    <LinkButton variant="secondary" href={`/admin/agents/${encodeURIComponent(a.email)}`}>
                      {t("colView")}
                    </LinkButton>
                    <LinkButton
                      variant="primary"
                      href={`/admin/agents/${encodeURIComponent(a.email)}/alliances`}
                    >
                      {t("colManageAlliances")}
                    </LinkButton>
                    {a.isAdmin ? (
                      <DemoteButton
                        email={a.email}
                        isLastAdmin={totalAdmins === 1 && a.isAdmin}
                        isSelf={a.email === user.email}
                      />
                    ) : (
                      <PromoteButton email={a.email} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Divider />
      <PromptLine>{t("agentsShowRange", { n: 50 })}</PromptLine>
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