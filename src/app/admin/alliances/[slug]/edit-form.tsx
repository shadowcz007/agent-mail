"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

interface Initial {
  name: string;
  bio: string;
  url: string;
  isPrimary: boolean;
}

export function AllianceEditForm({
  slug,
  initial,
  locale,
}: {
  slug: string;
  initial: Initial;
  locale: string;
}) {
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
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const name = fd.get("name")?.toString().trim() ?? "";
      const bio = fd.get("bio")?.toString().trim() ?? "";
      const urlRaw = fd.get("url")?.toString().trim() ?? "";
      const isPrimary = fd.get("isPrimary") === "on";
      await apiRequest(`/api/admin/alliances/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: { name, bio, url: urlRaw === "" ? null : urlRaw, isPrimary },
      });
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  const currentHint = locale === "zh-CN" ? "当前:" : "Current:";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg">{t("allianceSlugLabel")}</label>
        <div className="text-[13px] font-mono text-on-bg px-2 py-1.5 border border-outline-variant bg-surface-container">
          {slug} <StatusChip tone="muted">{t("allianceReadOnly")}</StatusChip>
        </div>
        <PromptLine>{t("allianceEditSlugHint")}</PromptLine>
      </div>

      <Field label={t("allianceEditNameLabel")} hint={`${currentHint} ${initial.name}`}>
        <Input name="name" type="text" defaultValue={initial.name} required maxLength={120} />
      </Field>

      <Field label={t("allianceEditBioLabel")} hint={t("allianceEditBioHint")}>
        <Textarea name="bio" defaultValue={initial.bio} required maxLength={2000} />
      </Field>

      <Field label={t("allianceEditUrlLabel")} hint={`${currentHint} ${initial.url || "—"}`}>
        <Input name="url" type="url" defaultValue={initial.url} placeholder={t("allianceEditUrlPlaceholder")} />
      </Field>

      <div className="border-t border-dashed border-outline pt-4 space-y-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isPrimary"
            defaultChecked={initial.isPrimary}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg">
            {t("alliancePrimaryFieldLabel")}
          </span>
          {initial.isPrimary && <StatusChip tone="accent">{t("allianceIsPrimary")}</StatusChip>}
        </label>
        <PromptLine>{t("alliancePrimaryFieldHint")}</PromptLine>
      </div>

      {error && (
        <PromptLine><StatusChip tone="error">{tCommon("error")}</StatusChip> {error}</PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex gap-2">
        <Button type="submit" variant="primary" loading={loading}>
          {t("allianceEditSubmit")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/alliances")}>
          {t("allianceEditCancel")}
        </Button>
      </div>

      <PromptLine>
        <StatusChip tone="default">{tCommon("note")}</StatusChip> {t("alliancePrimaryFieldNote")}
      </PromptLine>
    </form>
  );
}
