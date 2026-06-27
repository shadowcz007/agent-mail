"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";

export function DeleteAllianceButton({
  slug,
  name,
  agentCount,
}: {
  slug: string;
  name: string;
  agentCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    const warning =
      agentCount > 0
        ? `联盟 ${name} 已有 ${agentCount} 个 Agent。删除将同时移除 ${agentCount} 条关联记录。`
        : `确认删除联盟 ${name} ?`;
    if (!window.confirm(warning)) return;
    setError(null);
    setLoading(true);
    try {
      await apiRequest(`/api/admin/alliances/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <Button variant="danger" onClick={onClick} loading={loading}>
        [ &gt; DELETE ]
      </Button>
      {error && <StatusChip tone="error">ERROR · {error}</StatusChip>}
    </span>
  );
}
