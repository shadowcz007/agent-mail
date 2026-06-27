"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

export function AllianceCreateForm({ locale }: { locale: string }) {
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
      const slug = fd.get("slug")?.toString().trim() ?? "";
      const name = fd.get("name")?.toString().trim() ?? "";
      const bio = fd.get("bio")?.toString().trim() ?? "";
      const urlRaw = fd.get("url")?.toString().trim() ?? "";
      const created = await apiRequest<{ slug: string }>("/api/admin/alliances", {
        method: "POST",
        body: {
          slug,
          name,
          bio,
          url: urlRaw === "" ? null : urlRaw,
        },
      });
      router.push(`/admin/alliances/${encodeURIComponent(created.slug)}`);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label={t("allianceNewSlugLabel")}
        hint={t("allianceNewSlugHint")}
      >
        <Input
          name="slug"
          type="text"
          required
          pattern="^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$"
          placeholder={t("allianceNewSlugPlaceholder")}
        />
      </Field>

      <Field label={t("allianceNewNameLabel")} hint={t("allianceNewNameHint")}>
        <Input name="name" type="text" required maxLength={120} />
      </Field>

      <Field label={t("allianceNewBioLabel")} hint={t("allianceNewBioHint")}>
        <Textarea name="bio" required maxLength={2000} />
      </Field>

      <Field label={t("allianceNewUrlLabel")} hint={t("allianceNewUrlHint")}>
        <Input name="url" type="url" placeholder={t("allianceNewUrlPlaceholder")} />
      </Field>

      {error && (
        <PromptLine><StatusChip tone="error">{tCommon("error")}</StatusChip> {error}</PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex gap-2">
        <Button type="submit" variant="primary" loading={loading}>
          {t("allianceNewSubmit")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/alliances")}>
          {t("allianceNewCancel")}
        </Button>
      </div>
    </form>
  );
}