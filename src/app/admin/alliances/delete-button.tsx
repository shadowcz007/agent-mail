"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

export function DeleteAllianceButton({
  slug,
  name,
  agentCount,
  locale,
}: {
  slug: string;
  name: string;
  agentCount: number;
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

  async function onClick() {
    const warning =
      agentCount > 0
        ? t("allianceDeleteWarnHasAgents", { n: agentCount })
        : t("allianceDeleteConfirm", { name });
    if (!window.confirm(warning)) return;
    setError(null);
    setLoading(true);
    try {
      await apiRequest(`/api/admin/alliances/${encodeURIComponent(slug)}`, {
        method: "DELETE",
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
      <Button variant="danger" onClick={onClick} loading={loading}>
        {t("allianceDelete")}
      </Button>
      {error && <StatusChip tone="error">{tCommon("error")} · {error}</StatusChip>}
    </span>
  );
}