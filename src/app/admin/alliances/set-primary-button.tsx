"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { useI18n } from "@/i18n/client";

export function SetPrimaryButton({ slug, name, locale: _locale }: { slug: string; name: string; locale: string }) {
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

  async function onClick() {
    if (!window.confirm(t("setPrimaryConfirm", { name }))) return;
    setError(null);
    setLoading(true);
    try {
      await apiRequest(`/api/admin/alliances/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: { isPrimary: true },
      });
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <Button variant="secondary" onClick={onClick} loading={loading}>
        {t("setPrimaryButton")}
      </Button>
      {error && <span className="text-[10px] font-mono text-error">{error}</span>}
    </span>
  );
}
