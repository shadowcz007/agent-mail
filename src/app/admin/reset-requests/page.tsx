import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, timeLeft, truncate, formatNumber } from "@/lib/format";
import { ResetRowActions } from "./row-actions";
import type { ResetStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ResetRequestsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return <AccessDenied />;

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
      <H1>RESET REQUESTS</H1>

      <Section
        title={`PASSWORD RESET REQUESTS // ${status.toUpperCase()} (${formatNumber(requests.length)})`}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">FILTER :</span>
            <LinkButton variant={status === "pending" ? "primary" : "secondary"} href="?status=pending">
              [ PENDING ({formatNumber(pendingN)}) ]
            </LinkButton>
            <LinkButton variant={status === "resolved" ? "primary" : "secondary"} href="?status=resolved">
              [ RESOLVED ({formatNumber(resolvedN)}) ]
            </LinkButton>
            <LinkButton variant={status === "used" ? "primary" : "secondary"} href="?status=used">
              [ USED ({formatNumber(usedN)}) ]
            </LinkButton>
            <LinkButton variant={status === "all" ? "primary" : "secondary"} href="?status=all">
              [ ALL ({formatNumber(allN)}) ]
            </LinkButton>
          </div>

          {requests.length === 0 ? (
            <PromptLine>该状态下暂无重置请求。</PromptLine>
          ) : (
            <div className="border border-outline">
              {requests.map((r, i) => {
                const tone = !r.resolvedAt && !r.usedAt
                  ? "accent"
                  : r.usedAt
                    ? "muted"
                    : "default";
                const label = !r.resolvedAt && !r.usedAt
                  ? "PENDING"
                  : r.usedAt
                    ? "USED"
                    : "RESOLVED";
                const expired = new Date(r.expiresAt).getTime() < Date.now();
                const left = expired ? "EXPIRED" : timeLeft(r.expiresAt.toISOString());
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
                      <div><span className="text-dim">TOKEN</span> : {truncate(r.token, 30)}</div>
                      <div><span className="text-dim">REQUESTED</span> : {formatDateTimeUtc8(r.createdAt.toISOString())}</div>
                      {!r.usedAt && !r.resolvedAt && (
                        <>
                          <div><span className="text-dim">EXPIRES</span> : {formatDateTimeUtc8(r.expiresAt.toISOString())}</div>
                          <div>
                            <span className="text-dim">LEFT</span> : <StatusChip tone={expired ? "error" : "accent"}>{left}</StatusChip>
                          </div>
                        </>
                      )}
                      {r.resolvedAt && (
                        <>
                          <div><span className="text-dim">RESOLVED BY</span> : {user.email}</div>
                          <div><span className="text-dim">RESOLVED AT</span> : {formatDateTimeUtc8(r.resolvedAt.toISOString())}</div>
                        </>
                      )}
                      {r.usedAt && (
                        <div><span className="text-dim">USED AT</span> : {formatDateTimeUtc8(r.usedAt.toISOString())}</div>
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

      <PromptLine><StatusChip tone="warning">WARNING</StatusChip> 未 RESOLVED 的请求会在 24h 后自动作废。</PromptLine>
    </div>
  );
}

function AccessDenied() {
  return (
    <Section title="ACCESS DENIED">
      <PromptLine>! 当前会话不是管理员账户</PromptLine>
      <PromptLine>
        &gt; <Link href="/admin" className="underline">[ &gt; BACK TO LOGIN ]</Link>
      </PromptLine>
    </Section>
  );
}
