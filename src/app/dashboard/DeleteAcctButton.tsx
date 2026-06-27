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

interface Props {
  email: string;
  isLastAdmin: boolean;
  hasEvents: boolean;
}

export function DeleteAcctButton({ email, isLastAdmin, hasEvents }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      // 后端 303 重定向到 /。浏览器会自动跟跳,我们的页面会被卸载。
      // 但若 fetch 失败,需要手动处理错误。
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      if (res.ok) {
        // 兜底(不应到达这里 — 后端始终 303)
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
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
      setLoading(false);
    }
  }

  if (isLastAdmin) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="danger" disabled title="唯一 admin,删除前需先 demote 或 transfer">
          [ DELETE ACCT ]
        </Button>
        <PromptLine>
          <StatusChip tone="warning">BLOCKED</StatusChip>{" "}
          你是系统唯一的 admin。删除前请先去{" "}
          <a href="/admin/agents" className="underline">
            /admin/agents
          </a>{" "}
          transfer admin 身份。
        </PromptLine>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)}>
        [ DELETE ACCT ]
      </Button>
    );
  }

  return (
    <div className="border border-error bg-bg p-3 flex flex-col gap-2 min-w-[320px]">
      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-error font-bold">
        ⚠ CONFIRM DELETE
      </div>
      <div className="text-[11px] font-mono text-dim leading-relaxed">
        将<span className="text-on-bg">永久删除 </span>
        <span className="text-on-bg">{email}</span>。此操作不可恢复。
      </div>
      {hasEvents && (
        <div className="text-[11px] font-mono text-warning leading-relaxed">
          ! 你的所有 Event 也会一并删除(Schema 级联)。
        </div>
      )}
      <div className="text-[11px] font-mono text-dim leading-relaxed">
        输入 <code className="text-error">DELETE</code> 确认:
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
          [ &gt; CONFIRM DELETE ]
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
          [ CANCEL ]
        </Button>
      </div>
    </div>
  );
}