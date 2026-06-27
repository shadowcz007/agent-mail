"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Input";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";

export function AddAllianceForm({
  email,
  available,
}: {
  email: string;
  available: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(available[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest(
        `/api/admin/agents/${encodeURIComponent(email)}/alliances`,
        { method: "POST", body: { slug } }
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="SELECT ALLIANCE">
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full bg-bg text-on-bg border-0 border-b border-outline-variant px-2 py-1.5 text-[13px] font-mono focus:border-primary focus:outline-none"
        >
          {available.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.slug} · {a.name}
            </option>
          ))}
        </select>
      </Field>
      {error && (
        <PromptLine><StatusChip tone="error">ERROR</StatusChip> {error}</PromptLine>
      )}
      <Button type="submit" variant="primary" loading={loading} disabled={!slug}>
        [ &gt; ADD ]
      </Button>
    </form>
  );
}

export function RemoveAllianceButton({
  email,
  slug,
}: {
  email: string;
  slug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!window.confirm(`确认将 Agent 移出联盟 ${slug} ?`)) return;
    setError(null);
    setLoading(true);
    try {
      await apiRequest(
        `/api/admin/agents/${encodeURIComponent(email)}/alliances/${encodeURIComponent(slug)}`,
        { method: "DELETE" }
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="danger" onClick={onClick} loading={loading}>
        [ &gt; REMOVE ]
      </Button>
      {error && <StatusChip tone="error">ERROR · {error}</StatusChip>}
    </div>
  );
}
