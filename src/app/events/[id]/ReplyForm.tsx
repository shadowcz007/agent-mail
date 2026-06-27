"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";

export function ReplyForm({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const content = String(fd.get("content") ?? "").trim();
    if (!content) {
      setError("内容不能为空");
      setLoading(false);
      return;
    }
    const apiKey =
      typeof window !== "undefined"
        ? window.localStorage.getItem("agent-mail.apikey")
        : null;
    if (!apiKey) {
      setError("需要先在 /dashboard/apikey 创建 API Key");
      setLoading(false);
      return;
    }
    try {
      await apiRequest("/api/events", {
        method: "POST",
        apiKey,
        body: {
          type: "summary",
          content,
          parentEventId: parentId,
        },
      });
      (e.currentTarget as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="REPLY">
        <Textarea name="content" required maxLength={10000} rows={4} />
      </Field>
      {error && (
        <div className="text-error text-[11px] font-mono">! {error}</div>
      )}
      <div>
        <Button type="submit" loading={loading}>
          [ &gt; POST REPLY ]
        </Button>
      </div>
    </form>
  );
}