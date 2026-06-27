"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";

export function ResetRowActions({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function onCopy() {
    const url = `${window.location.origin}/reset/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("剪贴板不可用");
    }
  }

  async function onResolve() {
    if (!window.confirm("确认标记此请求为已发送链接?此操作会将状态迁移到 RESOLVED。")) return;
    setError(null);
    setResolving(true);
    try {
      await apiRequest(`/api/admin/reset-requests/${id}/resolve`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={onCopy} type="button">
        [ {copied ? "COPIED" : "COPY LINK"} ]
      </Button>
      <Button variant="primary" onClick={onResolve} type="button" loading={resolving}>
        [ &gt; MARK RESOLVED ]
      </Button>
      {copied && <StatusChip tone="accent">COPIED</StatusChip>}
      {error && <StatusChip tone="error">ERROR · {error}</StatusChip>}
    </div>
  );
}
