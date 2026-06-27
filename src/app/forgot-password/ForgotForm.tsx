"use client";

import { useState } from "react";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { EmailInput } from "@/components/ui/EmailInput";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { EMAIL_SUFFIX } from "@/lib/validate";
import { useI18n } from "@/i18n/client";

export function ForgotForm() {
  const { locale, t: tr } = useI18n();
  const t = tr.bind(null, "forgot");
  const tCommon = tr.bind(null, "common");

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || err.code;
    }
    return tCommon("requestFailed");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const fullEmail = `${data.emailLocal}${EMAIL_SUFFIX}`;

    setLoading(true);
    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: fullEmail },
      });
      setSubmitted(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  const emailHintPrefix = locale === "zh-CN" ? "完整地址:" : "Full address:";
  const emailLabel = t("emailLabel");

  if (submitted) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <StatusChip tone="accent">{t("submitted")}</StatusChip>
        </div>
        <PromptLine>{t("submittedBody")}</PromptLine>
        <PromptLine>{t("emailHint")}</PromptLine>
        <div className="pt-2">
          <a
            href="/login"
            className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
          >
            {t("backToLogin")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <EmailInput
        autoComplete="email"
        label={emailLabel}
        hintPrefix={emailHintPrefix}
      />

      {error && (
        <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          {t("submit")}
        </Button>
        <a
          href="/login"
          className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-outline bg-bg text-on-bg hover:bg-primary hover:text-on-primary transition-colors"
        >
          {t("backToLogin")}
        </a>
      </div>

      <div className="border-t border-dashed border-outline-variant" />
      <div className="flex items-center gap-2">
        <StatusChip tone="muted">{tCommon("ready")}</StatusChip>
      </div>
    </form>
  );
}