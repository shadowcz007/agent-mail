"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { PromptLine } from "@/components/ui/Section";
import { formatDateTimeUtc8 } from "@/lib/format";
import { useI18n } from "@/i18n/client";

interface Props {
  email: string;
  locale: string;
  apiKey: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
}

type Mode = "view" | "create" | "confirm-regenerate" | "confirm-destroy";

export function ApiKeyManager({ email, locale, apiKey: initialKey, createdAt, lastUsedAt }: Props) {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "apikey");
  const tCommon = tr.bind(null, "common");

  const [apiKey, setApiKey] = useState<string | null>(initialKey);
  const [mode, setMode] = useState<Mode>(initialKey ? "view" : "create");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const keyBoxRef = useRef<HTMLDivElement>(null);

  function translateError(err: unknown, fallback: string): string {
    if (err instanceof ApiCallError) {
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || fallback;
    }
    return tCommon("requestFailed");
  }

  async function fetchKey() {
    try {
      const data = await apiRequest<{
        apiKey: string | null;
        createdAt: string | null;
        lastUsedAt: string | null;
      }>(`/api/agents/${encodeURIComponent(email)}/apikey`);
      setApiKey(data.apiKey);
    } catch {
      /* keep current state */
    }
  }

  async function create() {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<{ apiKey: string }>(
        `/api/agents/${encodeURIComponent(email)}/apikey`,
        { method: "POST" }
      );
      setApiKey(data.apiKey);
      try {
        localStorage.setItem("agent-mail.apikey", data.apiKey);
      } catch {}
      setMode("view");
      router.refresh();
    } catch (err) {
      setError(translateError(err, t("createFailed")));
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<{ apiKey: string }>(
        `/api/agents/${encodeURIComponent(email)}/apikey/regenerate`,
        { method: "POST" }
      );
      setApiKey(data.apiKey);
      try {
        localStorage.setItem("agent-mail.apikey", data.apiKey);
      } catch {}
      setMode("view");
      router.refresh();
    } catch (err) {
      setError(translateError(err, t("regenerateFailed")));
    } finally {
      setLoading(false);
    }
  }

  async function destroy() {
    setError(null);
    setLoading(true);
    try {
      await apiRequest(
        `/api/agents/${encodeURIComponent(email)}/apikey`,
        { method: "DELETE" }
      );
      setApiKey(null);
      try {
        localStorage.removeItem("agent-mail.apikey");
      } catch {}
      setMode("create");
      router.refresh();
    } catch (err) {
      setError(translateError(err, t("destroyFailed")));
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    if (!apiKey) return;
    const fallback = () => {
      if (keyBoxRef.current) {
        const range = document.createRange();
        range.selectNodeContents(keyBoxRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(apiKey).catch(fallback);
    } else {
      fallback();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (mode === "create" || !apiKey) {
    return (
      <div className="space-y-4">
        <div className="font-mono text-[13px]">
          <PromptLine>
            STATUS : <StatusChip tone="muted">{tCommon("pending") /* NONE 同义 */}</StatusChip>
          </PromptLine>
        </div>
        <PromptLine>{t("none")}</PromptLine>
        {error && (
          <div className="text-error text-[11px] font-mono">! {error}</div>
        )}
        <div className="flex gap-2">
          <Button onClick={create} loading={loading}>
            {t("create")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="font-mono text-[13px] space-y-1">
        <PromptLine>
          STATUS :{" "}
          {copied ? (
            <StatusChip tone="accent">{tCommon("copied")}</StatusChip>
          ) : (
            <StatusChip tone="accent">{t("statusActive")}</StatusChip>
          )}
        </PromptLine>
        <PromptLine>{t("kvCreatedAt")} : {createdAt ? formatDateTimeUtc8(createdAt, locale) + " " + t("utc8Suffix") : "—"}</PromptLine>
        <PromptLine>{t("kvLastUsed")} : {lastUsedAt ? formatDateTimeUtc8(lastUsedAt, locale) + " " + t("utc8Suffix") : "—"}</PromptLine>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-dim">
          {t("kvKeyValue")}
        </div>
        <div
          ref={keyBoxRef}
          onClick={(e) => {
            const el = e.currentTarget;
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }}
          className="border border-outline bg-surface-container px-3 py-2 font-mono text-[12px] break-all select-all cursor-text"
        >
          {apiKey}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copyKey}>
          {t("copy")}
        </Button>
        {mode === "confirm-regenerate" ? (
          <>
            <Button onClick={regenerate} loading={loading}>
              {t("confirmRegenerate")}
            </Button>
            <Button variant="secondary" onClick={() => setMode("view")}>
              {tCommon("cancel")}
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setMode("confirm-regenerate")}>
            {t("regenerate")}
          </Button>
        )}
        {mode === "confirm-destroy" ? (
          <>
            <Button variant="danger" onClick={destroy} loading={loading}>
              {t("confirmDestroy")}
            </Button>
            <Button variant="secondary" onClick={() => setMode("view")}>
              {tCommon("cancel")}
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setMode("confirm-destroy")}>
            {t("destroy")}
          </Button>
        )}
      </div>

      {mode === "confirm-regenerate" && (
        <div className="space-y-1">
          <PromptLine>
            <span className="text-warning">( WARNING )</span> {t("regenerateWarn")}
          </PromptLine>
        </div>
      )}
      {mode === "confirm-destroy" && (
        <div className="space-y-1">
          <PromptLine>
            <span className="text-warning">( WARNING )</span> {t("destroyWarn")}
          </PromptLine>
        </div>
      )}

      {error && (
        <div className="text-error text-[11px] font-mono">! {error}</div>
      )}
    </div>
  );
}