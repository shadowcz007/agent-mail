"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { EMAIL_SUFFIX } from "@/lib/validate";
import { useI18n } from "@/i18n/client";

export function LoginForm() {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "admin");
  const tCommon = tr.bind(null, "common");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const map: Record<string, string> = {
        INVALID_CREDENTIALS: t("loginError"),
      };
      if (map[err.code]) return map[err.code];
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || err.code;
    }
    return tCommon("requestFailed");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const local = fd.get("emailLocal")?.toString().trim() ?? "";
      const password = fd.get("password")?.toString() ?? "";
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: `${local}${EMAIL_SUFFIX}`, password },
      });
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <EmailInput autoComplete="username" label={t("loginEmailLabel")} />

      <Field label={t("loginPwdLabel")}>
        <Input
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {error && (
        <PromptLine>
          <StatusChip tone="error">{tCommon("error")}</StatusChip> {error}
        </PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex flex-wrap gap-2 items-center">
        <Button type="submit" variant="primary" loading={loading}>
          {t("loginSubmit")}
        </Button>
        <LinkButton variant="ghost" href="/forgot-password">
          {t("loginForgot")}
        </LinkButton>
      </div>

      <PromptLine>
        <StatusChip tone={error ? "error" : "muted"}>
          {error ? "INVALID CREDENTIALS" : tCommon("ready")}
        </StatusChip>
      </PromptLine>
    </form>
  );
}