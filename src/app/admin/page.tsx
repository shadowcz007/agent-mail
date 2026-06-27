import { H1, Section, PromptLine } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, formatNumber } from "@/lib/format";
import { BootstrapForm } from "./bootstrap-form";
import { LoginForm } from "./login-form";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  const adminCount = await prisma.agent.count({ where: { isAdmin: true } });

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");
  const tCommon = getTranslator(locale, "common");

  // Bootstrap: no admin exists yet
  if (adminCount === 0) {
    return (
      <div className="space-y-6">
        <H1>{t("setupTitle")}</H1>
        <div className="border border-warning bg-bg text-on-bg p-3 space-y-1">
          <PromptLine><StatusChip tone="warning">{tCommon("warning")}</StatusChip> {t("setupWarnTitle")}</PromptLine>
          <PromptLine>{t("setupWarn1")}</PromptLine>
          <PromptLine>{t("setupWarn2")}</PromptLine>
          <PromptLine>{t("setupWarn3")}</PromptLine>
        </div>
        <Section title={t("setupCta")}>
          <BootstrapForm />
        </Section>
      </div>
    );
  }

  // Login: admin exists but current user is not admin
  if (!user || !user.isAdmin) {
    return (
      <div className="space-y-6">
        <H1>{t("loginTitle")}</H1>
        <Section title={t("loginSubtitle")}>
          <div className="space-y-1 mb-4">
            <PromptLine>{t("loginHint1")}</PromptLine>
            <PromptLine>{t("loginHint2", { n: adminCount })}</PromptLine>
          </div>
          <LoginForm />
          <div className="border-t border-dashed border-outline mt-4 pt-3 space-y-1">
            <PromptLine>{t("loginHint3")}</PromptLine>
          </div>
        </Section>
      </div>
    );
  }

  // Dashboard: current user is admin
  const [agentCount, eventCount, allianceCount, pendingResetCount] = await Promise.all([
    prisma.agent.count(),
    prisma.event.count(),
    prisma.alliance.count(),
    prisma.passwordResetToken.count({ where: { usedAt: null, resolvedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <H1>{t("dashTitle")}</H1>
      <Section title={t("welcome", { name: user.name.toUpperCase() })}>
        <div className="space-y-1">
          <PromptLine><StatusChip tone="accent">{t("adminOnline")}</StatusChip></PromptLine>
          <PromptLine>{t("kvEmail")} : {user.email}</PromptLine>
          <PromptLine>{t("kvLastSeen")} : {formatDateTimeUtc8(new Date().toISOString(), locale)} {t("utc8Suffix")}</PromptLine>
        </div>
      </Section>

      <Section title={t("statsTitle")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={t("statsAgents")} value={agentCount} />
          <Stat label={t("statsEvents")} value={eventCount} />
          <Stat label={t("statsAlliances")} value={allianceCount} />
          <div className="border border-outline p-3 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">{t("statsPendingResets")}</span>
            <span className="text-[20px] font-bold font-mono">{formatNumber(pendingResetCount)}</span>
            <LinkButton variant="secondary" href="/admin/reset-requests">{t("statsView")}</LinkButton>
          </div>
        </div>
      </Section>

      <Section title={t("quickActions")}>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="primary" href="/admin/reset-requests">{t("qaResetReq")}</LinkButton>
          <LinkButton variant="primary" href="/admin/agents">{t("qaAgents")}</LinkButton>
          <LinkButton variant="primary" href="/admin/alliances">{t("qaAlliances")}</LinkButton>
        </div>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-outline p-3 flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">{label}</span>
      <span className="text-[20px] font-bold font-mono">{formatNumber(value)}</span>
    </div>
  );
}