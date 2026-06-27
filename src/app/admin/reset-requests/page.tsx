import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, timeLeft, truncate, formatNumber } from "@/lib/format";
import { ResetRowActions } from "./row-actions";
import type { ResetStatus } from "@/lib/types";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ResetRequestsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");

  if (!user || !user.isAdmin) return <AccessDenied t={t} />;

  const sp = await searchParams;
  const status = (sp.status as ResetStatus) ?? "pending";

  const baseWhere = (s: ResetStatus) =>
    s === "pending"
      ? { usedAt: null, resolvedAt: null }
      : s === "resolved"
        ? { resolvedAt: { not: null }, usedAt: null }
        : s === "used"
          ? { usedAt: { not: null } }
          : {};

  const [counts, requests] = await Promise.all([
    Promise.all([
      prisma.passwordResetToken.count({ where: baseWhere("pending") }),
      prisma.passwordResetToken.count({ where: baseWhere("resolved") }),
      prisma.passwordResetToken.count({ where: baseWhere("used") }),
      prisma.passwordResetToken.count({ where: {} }),
    ]),
    prisma.passwordResetToken.findMany({
      where: baseWhere(status),
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const [pendingN, resolvedN, usedN, allN] = counts;

  return (
    <div className="space-y-6">
      <H1>{t("resetRequestsTitle")}</H1>

      <Section
        title={t("resetRequestsSubtitle", { status: status.toUpperCase(), n: formatNumber(requests.length) })}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">{t("filterLabel")}</span>
            <LinkButton variant={status === "pending" ? "primary" : "secondary"} href="?status=pending">
              {t("filterPending", { n: formatNumber(pendingN) })}
            </LinkButton>
            <LinkButton variant={status === "resolved" ? "primary" : "secondary"} href="?status=resolved">
              {t("filterResolved", { n: formatNumber(resolvedN) })}
            </LinkButton>
            <LinkButton variant={status === "used" ? "primary" : "secondary"} href="?status=used">
              {t("filterUsed", { n: formatNumber(usedN) })}
            </LinkButton>
            <LinkButton variant={status === "all" ? "primary" : "secondary"} href="?status=all">
              {t("filterAll", { n: formatNumber(allN) })}
            </LinkButton>
          </div>

          {requests.length === 0 ? (
            <PromptLine>{t("noRequestsThisStatus")}</PromptLine>
          ) : (
            <div className="border border-outline">
              {requests.map((r, i) => {
                const tone = !r.resolvedAt && !r.usedAt
                  ? "accent"
                  : r.usedAt
                    ? "muted"
                    : "default";
                const label = !r.resolvedAt && !r.usedAt
                  ? t("statusPending")
                  : r.usedAt
                    ? t("statusUsed")
                    : t("statusResolved");
                const expired = new Date(r.expiresAt).getTime() < Date.now();
                const left = expired ? t("statusExpired") : timeLeft(r.expiresAt.toISOString());
                return (
                  <div
                    key={r.id}
                    className={`px-3 py-3 border-b border-outline-variant last:border-b-0 ${expired ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                          [ {String(i + 1).padStart(2, "0")} ]
                        </span>
                        <span className="text-[13px] font-mono text-on-bg truncate">{r.agentEmail}</span>
                      </div>
                      <StatusChip tone={tone}>{label}</StatusChip>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 pl-11 text-[11px] font-mono">
                      <div><span className="text-dim">{t("colToken")}</span> : {truncate(r.token, 30)}</div>
                      <div><span className="text-dim">{t("colRequested")}</span> : {formatDateTimeUtc8(r.createdAt.toISOString(), locale)}</div>
                      {!r.usedAt && !r.resolvedAt && (
                        <>
                          <div><span className="text-dim">{t("colExpires")}</span> : {formatDateTimeUtc8(r.expiresAt.toISOString(), locale)}</div>
                          <div>
                            <span className="text-dim">{t("colLeft")}</span> : <StatusChip tone={expired ? "error" : "accent"}>{left}</StatusChip>
                          </div>
                        </>
                      )}
                      {r.resolvedAt && (
                        <>
                          <div><span className="text-dim">{t("colResolvedBy")}</span> : {user.email}</div>
                          <div><span className="text-dim">{t("colResolvedAt")}</span> : {formatDateTimeUtc8(r.resolvedAt.toISOString(), locale)}</div>
                        </>
                      )}
                      {r.usedAt && (
                        <div><span className="text-dim">{t("colUsedAt")}</span> : {formatDateTimeUtc8(r.usedAt.toISOString(), locale)}</div>
                      )}
                    </div>
                    <div className="mt-2 pl-11 flex flex-wrap gap-2">
                      {!r.usedAt && !r.resolvedAt && (
                        <ResetRowActions id={r.id} token={r.token} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      <Divider />

      <PromptLine><StatusChip tone="warning">WARNING</StatusChip> {t("copyWarn")}</PromptLine>
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