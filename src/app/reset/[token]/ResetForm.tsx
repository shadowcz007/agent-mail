"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { isStrongPassword } from "@/lib/validate";
import { useI18n } from "@/i18n/client";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "reset");
  const tCommon = tr.bind(null, "common");

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
    const newPassword = data.newPassword || "";
    const confirm = data.confirmPassword || "";

    if (newPassword !== confirm) {
      setError(t("pwdMismatch"));
      return;
    }
    const strong = isStrongPassword(newPassword);
    if (!strong.ok) {
      const fromErrDict = tr("errors", strong.code!);
      setError(fromErrDict.startsWith("__") ? t("weakPassword") : fromErrDict);
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
      });
      router.push("/login?reset=success");
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t("newPwdLabel")} hint={t("pwdHint")}>
        <Input
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <Field label={t("confirmLabel")}>
        <Input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>

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
          {t("cancel")}
        </a>
      </div>
    </form>
  );
}