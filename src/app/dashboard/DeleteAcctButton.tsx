"use client";
// Account 自删按钮 — 永久删除当前 session 对应的 agent 账户。
// 二次确认:点 DELETE ACCT → 展开 inline 确认面板 → 确认后 DELETE /api/agents/[email]
// ⚠️ 注意:当前 schema Event.agent onDelete: Cascade,删账户会一并删历史 events。
import { useState } from "react";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { useI18n } from "@/i18n/client";

interface Props {
  email: string;
  isLastAdmin: boolean;
  hasEvents: boolean;
}

export function DeleteAcctButton({ email, isLastAdmin, hasEvents }: Props) {
  const { t: tr } = useI18n();
  const t = tr.bind(null, "dashboard");
  const tCommon = tr.bind(null, "common");

  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || err.code;
    }
    return tCommon("requestFailed");
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      // 后端 303 重定向到 /。浏览器会自动跟跳,我们的页面会被卸载。
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new ApiCallError(
        data.error || "INTERNAL_ERROR",
        res.status,
        data.message,
        data.details
      );
    } catch (err) {
      setError(translateError(err));
      setLoading(false);
    }
  }

  if (isLastAdmin) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="danger" disabled title={t("deleteAcctTitle")}>
          {t("deleteAcct")}
        </Button>
        <PromptLine>
          <StatusChip tone="warning">{tCommon("blocked")}</StatusChip>{" "}
          {t("deleteAcctBlockedPrefix")}
          <a href="/admin/agents" className="underline">
            {t("deleteAcctBlockedLink")}
          </a>
          {t("deleteAcctBlockedSuffix")}
        </PromptLine>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t("deleteAcct")}
      </Button>
    );
  }

  return (
    <div className="border border-error bg-bg p-3 flex flex-col gap-2 min-w-[320px]">
      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-error font-bold">
        {t("deleteAcctConfirmTitle")}
      </div>
      <div className="text-[11px] font-mono text-dim leading-relaxed">
        {t("deleteAcctConfirmBody1")}
        <span className="text-on-bg">{email}</span>
        {t("deleteAcctConfirmBody3")}
      </div>
      {hasEvents && (
        <div className="text-[11px] font-mono text-warning leading-relaxed">
          {t("deleteAcctHasEventsWarn")}
        </div>
      )}
      <div className="text-[11px] font-mono text-dim leading-relaxed">
        {t("deleteAcctTypePrompt")}<code className="text-error">DELETE</code>{t("deleteAcctTypePromptSuffix")}
      </div>
      <Input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        autoComplete="off"
        disabled={loading}
      />
      {error && (
        <div className="text-error text-[11px] font-mono">! {error}</div>
      )}
      <div className="flex gap-2">
        <Button
          variant="danger"
          onClick={submit}
          disabled={confirmText !== "DELETE" || loading}
          loading={loading}
        >
          {t("deleteAcctSubmit")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
          disabled={loading}
        >
          {t("deleteAcctCancel")}
        </Button>
      </div>
    </div>
  );
}