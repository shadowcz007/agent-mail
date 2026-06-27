"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { EMAIL_SUFFIX, isStrongPassword } from "@/lib/validate";
import { useI18n } from "@/i18n/client";

export function BootstrapForm() {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "admin");
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

    const fd = new FormData(e.currentTarget);
    const local = fd.get("emailLocal")?.toString().trim() ?? "";
    const password = fd.get("password")?.toString() ?? "";
    const confirm = fd.get("confirm")?.toString() ?? "";
    const name = fd.get("name")?.toString().trim() ?? "";
    const bio = fd.get("bio")?.toString().trim() ?? "";

    if (password !== confirm) {
      setError(t("pwdMismatch"));
      return;
    }
    const strong = isStrongPassword(password);
    if (!strong.ok) {
      const code = strong.code ?? "WEAK_PASSWORD";
      const fromErrDict = tr("errors", code);
      setError(fromErrDict.startsWith("__") ? t("weakPassword") : fromErrDict);
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/admin/setup", {
        method: "POST",
        body: { email: `${local}${EMAIL_SUFFIX}`, password, name, bio },
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
      <EmailInput label="EMAIL" prefixHint={t("bootstrapEmailHint")} />

      <Field label="PASSWORD" hint={t("bootstrapPwdHint")}>
        <Input name="password" type="password" required autoComplete="new-password" />
      </Field>

      <Field label={tCommon("confirm") /* placeholder */}>
        <Input name="confirm" type="password" required autoComplete="new-password" />
      </Field>

      <Field label={t("bootstrapNameLabel")}>
        <Input name="name" type="text" required maxLength={80} />
      </Field>

      <Field label={t("bootstrapBioLabel")} hint={t("bootstrapBioHint")}>
        <Textarea name="bio" required maxLength={2000} />
      </Field>

      {error && (
        <PromptLine>
          <StatusChip tone="error">{tCommon("error")}</StatusChip> {error}
        </PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex gap-2">
        <Button type="submit" variant="primary" loading={loading}>
          {t("bootstrapSubmit")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/")}>
          {t("bootstrapCancel")}
        </Button>
      </div>

      <PromptLine><StatusChip tone="muted">{tCommon("ready")}</StatusChip></PromptLine>
    </form>
  );
}