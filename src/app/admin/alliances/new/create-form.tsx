"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";

export function AllianceCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const slug = fd.get("slug")?.toString().trim() ?? "";
      const name = fd.get("name")?.toString().trim() ?? "";
      const bio = fd.get("bio")?.toString().trim() ?? "";
      const urlRaw = fd.get("url")?.toString().trim() ?? "";
      const created = await apiRequest<{ slug: string }>("/api/admin/alliances", {
        method: "POST",
        body: {
          slug,
          name,
          bio,
          url: urlRaw === "" ? null : urlRaw,
        },
      });
      router.push(`/admin/alliances/${encodeURIComponent(created.slug)}`);
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="SLUG"
        hint="只能包含小写字母、数字、连字符;创建后不可修改"
      >
        <Input
          name="slug"
          type="text"
          required
          pattern="^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$"
          placeholder="new-alliance"
        />
      </Field>

      <Field label="NAME" hint="联盟显示名称">
        <Input name="name" type="text" required maxLength={120} />
      </Field>

      <Field label="BIO" hint="联盟简介,支持多行">
        <Textarea name="bio" required maxLength={2000} />
      </Field>

      <Field label="URL" hint="可选,联盟主页链接">
        <Input name="url" type="url" placeholder="https://example.com" />
      </Field>

      {error && (
        <PromptLine><StatusChip tone="error">ERROR</StatusChip> {error}</PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex gap-2">
        <Button type="submit" variant="primary" loading={loading}>
          [ &gt; CREATE ALLIANCE ]
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/alliances")}>
          [ CANCEL ]
        </Button>
      </div>
    </form>
  );
}
