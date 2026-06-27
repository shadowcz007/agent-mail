// /reset/[token] — 重置密码(VALID/INVALID 双态)
// LAYOUT §3.10 · API §0.4 POST /api/auth/reset-password
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Section, PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateTimeUtc8, timeLeft } from "@/lib/format";
import { ResetForm } from "./ResetForm";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const locale = await getLocale();
  const t = getTranslator(locale, "reset");
  const tCommon = getTranslator(locale, "common");

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  const isValid =
    !!record &&
    !record.usedAt &&
    record.expiresAt.getTime() > Date.now();

  if (!isValid) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Section title={t("title")}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StatusChip tone="error">{tCommon("error")}</StatusChip>
              <span className="text-[13px] font-mono text-error">
                {t("invalidTitle")}
              </span>
            </div>
            <div className="pt-2" />
            <PromptLine>{t("invalidBody1")}</PromptLine>
            <PromptLine>{t("invalidReason1")}</PromptLine>
            <PromptLine>{t("invalidReason2")}</PromptLine>
            <PromptLine>{t("invalidReason3")}</PromptLine>
            <PromptLine>{t("invalidHint")}</PromptLine>
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-primary bg-primary text-on-primary hover:bg-accent hover:text-on-accent transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title={t("title")}>
        <div className="flex flex-col gap-2 text-[13px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              {t("accountLabel")}
            </span>
            <span>{record!.agentEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              {t("tokenLabel")}
            </span>
            <span className="truncate">{token}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              {t("expiresLabel")}
            </span>
            <span>{formatDateTimeUtc8(record!.expiresAt.toISOString(), locale)} {t("utc8Suffix")}</span>
            <StatusChip tone="accent">
              {timeLeft(record!.expiresAt.toISOString())}
            </StatusChip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              {t("statusLabel")}
            </span>
            <StatusChip tone="accent">{t("statusValid")}</StatusChip>
          </div>
        </div>

        <div className="border-t border-dashed border-outline-variant my-4" />

        <ResetForm token={token} />

        <div className="border-t border-dashed border-outline-variant my-4" />
        <PromptLine>{t("successHint")}</PromptLine>
      </Section>
    </div>
  );
}