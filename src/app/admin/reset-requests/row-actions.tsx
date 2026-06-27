"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

export function ResetRowActions({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "admin");
  const tCommon = tr.bind(null, "common");

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resolving, setResolving] = useState(false);

  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || err.code;
    }
    return tCommon("requestFailed");
  }

  async function onCopy() {
    const url = `${window.location.origin}/reset/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError(t("clipboardUnavailable"));
    }
  }

  async function onResolve() {
    if (!window.confirm(t("markResolveConfirm"))) return;
    setError(null);
    setResolving(true);
    try {
      await apiRequest(`/api/admin/reset-requests/${id}/resolve`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={onCopy} type="button">
        [ {copied ? t("copiedShort").replace("[", "").replace("]", "") : "COPY LINK" } ]
      </Button>
      <Button variant="primary" onClick={onResolve} type="button" loading={resolving}>
        {t("markResolved")}
      </Button>
      {copied && <StatusChip tone="accent">{tCommon("copied")}</StatusChip>}
      {error && <StatusChip tone="error">{tCommon("error")} · {error}</StatusChip>}
    </div>
  );
}