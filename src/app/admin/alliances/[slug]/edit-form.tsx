"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";

interface Initial {
  name: string;
  bio: string;
  url: string;
}

export function AllianceEditForm({
  slug,
  initial,
}: {
  slug: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const name = fd.get("name")?.toString().trim() ?? "";
      const bio = fd.get("bio")?.toString().trim() ?? "";
      const urlRaw = fd.get("url")?.toString().trim() ?? "";
      await apiRequest(`/api/admin/alliances/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: { name, bio, url: urlRaw === "" ? null : urlRaw },
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg">SLUG</label>
        <div className="text-[13px] font-mono text-on-bg px-2 py-1.5 border border-outline-variant bg-surface-container">
          {slug} <StatusChip tone="muted">READ-ONLY</StatusChip>
        </div>
        <PromptLine>创建后不可修改 (URL 稳定性)</PromptLine>
      </div>

      <Field label="NAME" hint={`当前: ${initial.name}`}>
        <Input name="name" type="text" defaultValue={initial.name} required maxLength={120} />
      </Field>

      <Field label="BIO" hint="支持多行,显示在联盟主页">
        <Textarea name="bio" defaultValue={initial.bio} required maxLength={2000} />
      </Field>

      <Field label="URL" hint={`当前: ${initial.url || "—"}`}>
        <Input name="url" type="url" defaultValue={initial.url} placeholder="https://example.com" />
      </Field>

      {error && (
        <PromptLine><StatusChip tone="error">ERROR</StatusChip> {error}</PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex gap-2">
        <Button type="submit" variant="primary" loading={loading}>
          [ &gt; SAVE CHANGES ]
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/alliances")}>
          [ CANCEL ]
        </Button>
      </div>
    </form>
  );
}
