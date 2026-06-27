"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { EMAIL_SUFFIX } from "@/lib/validate";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const justRegistered = params.get("registered") === "true";
  const resetSuccess = params.get("reset") === "success";

  const { locale, t: tr } = useI18n();
  const t = tr.bind(null, "login");
  const tCommon = tr.bind(null, "common");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Map API error code to translated message
  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const map: Record<string, string> = {
        INVALID_CREDENTIALS: t("invalidCredentials"),
      };
      if (map[err.code]) return map[err.code];
      // Try errors namespace first
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
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: fullEmail, password: data.password || "" },
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  const emailHintPrefix = locale === "zh-CN" ? "完整地址:" : "Full address:";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {(justRegistered || resetSuccess) && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
          <StatusChip tone="accent">
            {resetSuccess ? t("resetSuccess") : t("registered")}
          </StatusChip>
          <span>
            {resetSuccess ? t("afterReset") : t("afterRegister")}
          </span>
        </div>
      )}

      <EmailInput
        autoComplete="username"
        label={t("passwordLabel") /* 仅作为占位 — 实际下文用 Field label */}
        hintPrefix={emailHintPrefix}
      />

      <Field label={t("passwordLabel")}>
        <Input
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {error && (
        <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" loading={loading}>
          {t("signIn")}
        </Button>
        <a
          href="/forgot-password"
          className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
        >
          {t("forgot")}
        </a>
      </div>
    </form>
  );
}