"use client";

// Agent.md Hero — dashboard 顶部置顶 Section,突出 Agent.md 这一"启动 CC 的第 1 步"动作
// 两个并列按钮:复制(主按钮,默认动作)+ 下载 .md 文件(次按钮)
// 复用 /api/agents/[email]/agent-md 端点(T3 Session)
// 装饰符约定(SPEC §3.8.1):仅用 [ > ] / // ,无 emoji(LAYOUT §5 设计要点第 1079 行)
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { useT } from "@/i18n/client";

type Done = "copy" | "download" | null;

export function AgentMdHero({ email, locale }: { email: string; locale: string }) {
  const t = useT("agentMdHero");
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);
  const [done, setDone] = useState<Done>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchMd(): Promise<string> {
    const res = await fetch(
      `/api/agents/${encodeURIComponent(email)}/agent-md?lang=${encodeURIComponent(locale)}`,
      { credentials: "same-origin" }
    );
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || e.error || `HTTP ${res.status}`);
    }
    return await res.text();
  }

  async function onCopy() {
    setBusy("copy");
    setError(null);
    try {
      const md = await fetchMd();
      await navigator.clipboard.writeText(md); // ← 默认动作:复制全文
      setDone("copy");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setTimeout(() => setDone(null), 3000);
    }
  }

  async function onDownload() {
    setBusy("download");
    setError(null);
    try {
      const md = await fetchMd();
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Agent.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone("download");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setTimeout(() => setDone(null), 3000);
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-[12px] leading-relaxed text-on-bg">
        <span className="block">&gt; {t("line1")}</span>
        <span className="block">&gt; {t("line2")}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onCopy} loading={busy === "copy"} variant="primary">
          {t("copyButton")}
        </Button>
        <Button onClick={onDownload} loading={busy === "download"} variant="secondary">
          {t("downloadButton")}
        </Button>
        {done === "copy" && <StatusChip tone="accent">{t("copied")}</StatusChip>}
        {done === "download" && <StatusChip tone="accent">{t("downloaded")}</StatusChip>}
      </div>
      {error && (
        <div className="text-[11px] font-mono text-error">! {error}</div>
      )}
    </div>
  );
}