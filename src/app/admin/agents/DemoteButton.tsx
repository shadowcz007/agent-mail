"use client";
// Admin demote 按钮 + inline 表单
// - 普通 demote:点 [ DEMOTE ] → POST /api/admin/agents/[email]/demote
// - 唯一 admin:点 [ TRANSFER ] → 弹出 inline 表单输入 newAdminEmail (用 EmailInput 组件)
// - 自己 demote:明确警告"sessions will lose admin immediately"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { EmailInput } from "@/components/ui/EmailInput";
import { EMAIL_SUFFIX } from "@/lib/validate";
import { useI18n } from "@/i18n/client";

interface Props {
  email: string;
  isLastAdmin: boolean;
  isSelf: boolean;
}

export function DemoteButton({ email, isLastAdmin, isSelf }: Props) {
  const router = useRouter();
  const { t: tr } = useI18n();
  const t = tr.bind(null, "admin");
  const tCommon = tr.bind(null, "common");

  const [open, setOpen] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    promotedReplacement: { email: string } | null;
  }>(null);

  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || err.code;
    }
    return tCommon("requestFailed");
  }

  if (done) {
    return (
      <span className="text-[10px] font-mono text-success">
        {t("demoteDone")}
        {done.promotedReplacement && (
          <> · {t("demoteSuccessMsg")}<span className="text-primary">{done.promotedReplacement.email}</span></>
        )}
      </span>
    );
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<{
        email: string;
        isAdmin: boolean;
        promotedReplacement: { email: string; isAdmin: boolean } | null;
      }>(`/api/admin/agents/${encodeURIComponent(email)}/demote`, {
        method: "POST",
        body: isLastAdmin
          ? { newAdminEmail: `${replacement.trim()}${EMAIL_SUFFIX}` }
          : {},
      });
      setDone({ promotedReplacement: data.promotedReplacement });
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  // 唯一 admin → 强制 TRANSFER 流程
  if (isLastAdmin) {
    if (!open) {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border border-warning bg-bg text-warning px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-warning hover:text-on-warning transition-colors"
        >
          {t("transferAdmin")}
        </button>
      );
    }
    return (
      <div className="border border-warning bg-bg p-3 flex flex-col gap-2 min-w-[320px]">
        <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-warning font-bold">
          {t("transferTitle")}
        </div>
        <div className="text-[11px] font-mono text-dim leading-relaxed">
          {t("transferBody1", { email })}
        </div>
        <EmailInput
          label={t("transferEmailLabel")}
          prefixHint={t("transferBody2")}
          value={replacement}
          onChange={setReplacement}
          placeholder="new-admin"
          autoComplete="off"
        />
        {error && (
          <div className="text-error text-[11px] font-mono">! {error}</div>
        )}
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={submit}
            disabled={!replacement.trim() || loading}
            loading={loading}
          >
            {t("transferSubmit")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
              setReplacement("");
              setError(null);
            }}
            disabled={loading}
          >
            {tCommon("cancel")}
          </Button>
        </div>
        {isSelf && (
          <div className="text-[10px] font-mono text-warning">
            {t("demoteSelfWarn")}
          </div>
        )}
      </div>
    );
  }

  // 普通 demote
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-outline bg-bg text-on-bg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-warning hover:text-on-warning hover:border-warning transition-colors"
      >
        {t("demote")}
      </button>
    );
  }
  return (
    <div className="border border-outline bg-bg p-3 flex flex-col gap-2 min-w-[280px]">
      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-on-bg font-bold">
        {t("demoteConfirmTitle")}
      </div>
      <div className="text-[11px] font-mono text-dim leading-relaxed">
        {t("demoteConfirmBody", { email })}
        {isSelf && (
          <span className="block mt-1 text-warning">
            {t("demoteSelfConfirmWarn")}
          </span>
        )}
      </div>
      {error && (
        <div className="text-error text-[11px] font-mono">! {error}</div>
      )}
      <div className="flex gap-2">
        <Button variant="danger" onClick={submit} loading={loading}>
          {t("demoteConfirm")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={loading}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </div>
  );
}