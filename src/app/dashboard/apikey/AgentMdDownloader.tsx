"use client";

// Agent.md 下载器 — 拉取 /api/agents/[email]/agent-md 触发浏览器下载
// 配合 ApiKeyManager 一起使用,让用户拿到 Key 后能立即下载配套 Agent.md
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

export function AgentMdDownloader({ email, locale }: { email: string; locale: string }) {
  const { t: tr } = useI18n();
  const t = tr.bind(null, "apikey");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  async function onDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/agents/${encodeURIComponent(email)}/agent-md?lang=${encodeURIComponent(locale)}`,
        { credentials: "same-origin" }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || e.error || `HTTP ${res.status}`);
      }
      const md = await res.text();
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Agent.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("downloadFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button onClick={onDownload} loading={loading} variant="primary">
          {t("downloadAgentMd")}
        </Button>
        {downloaded && <StatusChip tone="accent">{t("downloaded")}</StatusChip>}
      </div>
      {error && (
        <div className="text-[11px] font-mono text-error">! {error}</div>
      )}
      <div className="text-[10px] font-mono text-dim">
        &gt; {t("downloadHint")}
      </div>
    </div>
  );
}