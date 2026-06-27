import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateUtc8, formatNumber, truncate } from "@/lib/format";
import { DeleteAllianceButton } from "./delete-button";
import { SetPrimaryButton } from "./set-primary-button";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminAlliancesPage() {
  const user = await getCurrentUser();

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");
  const tCommon = getTranslator(locale, "common");

  if (!user || !user.isAdmin) return <AccessDenied t={t} />;

  const alliances = await prisma.alliance.findMany({
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { agents: true } } },
  });
  const total = alliances.length;
  const primary = alliances.find((a) => a.isPrimary) ?? null;

  return (
    <div className="space-y-6">
      <H1>{t("alliancesTitle")}</H1>

      <Section title={t("currentPrimaryLabel")}>
        {primary ? (
          <div className="flex items-center gap-3 text-[13px] font-mono flex-wrap">
            <StatusChip tone="accent">{t("allianceIsPrimary")}</StatusChip>
            <span className="text-on-bg">{primary.name}</span>
            <span className="text-dim">({primary.slug})</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[13px] font-mono">
            <StatusChip tone="warning">{tCommon("warning")}</StatusChip>
            <span className="text-on-bg">{t("currentPrimaryNone")}</span>
          </div>
        )}
      </Section>

      <Section title={t("alliancesTitleCount", { n: formatNumber(total) })}>
        {alliances.length === 0 ? (
          <PromptLine>{t("alliancesNone")}</PromptLine>
        ) : (
          <div className="border border-outline">
            {alliances.map((a, i) => (
              <div
                key={a.id}
                className="px-3 py-3 border-b border-outline-variant last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                      [ {String(i + 1).padStart(2, "0")} ]
                    </span>
                    <span className="text-[13px] font-mono text-on-bg truncate">{a.slug}</span>
                    {a.isPrimary && <StatusChip tone="accent">{t("allianceIsPrimary")}</StatusChip>}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 pl-11 text-[11px] font-mono">
                  <div><span className="text-dim">{t("allianceKvName")}</span> : {a.name}</div>
                  <div>
                    <span className="text-dim">{t("allianceKvAgents")}</span> : {formatNumber(a._count.agents)}
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-dim">{t("allianceKvBio")}</span> : {truncate(a.bio, 120)}
                  </div>
                  <div><span className="text-dim">{t("allianceKvUrl")}</span> : {a.url ?? "—"}</div>
                  <div><span className="text-dim">{t("allianceKvJoined")}</span> : {formatDateUtc8(a.createdAt.toISOString(), locale)}</div>
                </div>
                <div className="mt-2 pl-11 flex flex-wrap gap-2">
                  <LinkButton
                    variant="primary"
                    href={`/admin/alliances/${encodeURIComponent(a.slug)}`}
                  >
                    [ &gt; EDIT ]
                  </LinkButton>
                  <LinkButton
                    variant="secondary"
                    href={`/admin/agents?alliance=${encodeURIComponent(a.slug)}`}
                  >
                    [ &gt; VIEW AGENTS ]
                  </LinkButton>
                  {!a.isPrimary && (
                    <SetPrimaryButton slug={a.slug} name={a.name} locale={locale} />
                  )}
                  <DeleteAllianceButton
                    slug={a.slug}
                    name={a.name}
                    agentCount={a._count.agents}
                    locale={locale}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Divider />

      <div className="flex gap-2 flex-wrap">
        <LinkButton variant="primary" href="/admin/alliances/new">
          {t("alliancesNew")}
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