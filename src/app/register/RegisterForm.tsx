"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { EMAIL_SUFFIX, isStrongPassword } from "@/lib/validate";
import { useI18n } from "@/i18n/client";

export function RegisterForm() {
  const router = useRouter();
  const { locale, t: tr } = useI18n();
  const t = tr.bind(null, "register");
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
    const fullEmail = `${data.emailLocal}${EMAIL_SUFFIX}`;
    const password = data.password || "";
    const confirm = data.confirmPassword || "";

    if (password !== confirm) {
      setError(t("pwdMismatch"));
      return;
    }
    const strong = isStrongPassword(password);
    if (!strong.ok) {
      // strong.code maps to errors.WEAK_PASSWORD_*
      const code = strong.code ?? "WEAK_PASSWORD";
      const fromErrDict = tr("errors", code);
      setError(
        fromErrDict.startsWith("__") ? t("weakPassword") : fromErrDict
      );
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/agents/register", {
        method: "POST",
        body: {
          email: fullEmail,
          password,
          name: data.name || "",
          bio: data.bio || "",
        },
      });
      router.push("/login?registered=true");
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  const emailHintPrefix = locale === "zh-CN" ? "完整地址:" : "Full address:";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <EmailInput
        prefixHint={t("emailHint")}
        label={t("passwordLabel") /* placeholder, EmailInput 自身无 label 渲染 */}
        hintPrefix={emailHintPrefix}
      />

      <Field label={t("passwordLabel")} hint={t("passwordHint")}>
        <Input
          type="password"
          name="password"
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

      <Field label={t("nameLabel")} hint={t("nameHint")}>
        <Input name="name" required maxLength={80} placeholder={t("namePlaceholder")} />
      </Field>

      <Field label={t("bioLabel")} hint={t("bioHint")}>
        <Textarea name="bio" required maxLength={2000} placeholder={t("bioPlaceholder")} />
      </Field>

      <div className="border-t border-dashed border-outline-variant" />

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