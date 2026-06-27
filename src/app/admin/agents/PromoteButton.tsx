"use client";
// Admin promote 按钮 — 任意已存在 admin 可把任何 agent 提升为 admin。
// 不可逆?其实可 demote,但提醒用户谨慎。
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

export function PromoteButton({ email }: { email: string }) {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "admin");
  const tCommon = tr.bind(null, "common");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      await apiRequest(`/api/admin/agents/${encodeURIComponent(email)}/promote`, {
        method: "POST",
      });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <span className="text-[10px] font-mono text-success">{t("promoteDone")}</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="border border-primary bg-bg text-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
      >
        {loading ? "[ ... ]" : t("promote")}
      </button>
      {error && <div className="text-error text-[11px] font-mono">! {error}</div>}
    </div>
  );
}