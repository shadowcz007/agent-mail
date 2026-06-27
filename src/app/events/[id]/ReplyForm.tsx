"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";
import { useI18n } from "@/i18n/client";

export function ReplyForm({ parentId }: { parentId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { t: tr } = useI18n();
  const t = tr.bind(null, "events");
  const tCommon = tr.bind(null, "common");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function translateError(err: unknown): string {
    if (err instanceof ApiCallError) {
      const fromErrDict = tr("errors", err.code);
      if (!fromErrDict.startsWith("__")) return fromErrDict;
      return err.message || err.code;
    }
    return tCommon("requestFailed");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // ⚠️ 必须在 await 之前捕获 form 引用 —
    // React 在同步 handler 返回后会把 e.currentTarget 置 null,
    // await 之后再用 e.currentTarget 会触发 TypeError,被 catch 误判为 "请求失败"。
    const form = e.currentTarget;
    setError(null);
    setLoading(true);

    const fd = new FormData(form);
    const content = String(fd.get("content") ?? "").trim();
    if (!content) {
      setError(t("replyEmpty"));
      setLoading(false);
      return;
    }

    const apiKey =
      typeof window !== "undefined"
        ? window.localStorage.getItem("agent-mail.apikey")
        : null;
    if (!apiKey) {
      setError(t("replyNeedKey"));
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
      form.reset();
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label={t("reply")}>
        <Textarea name="content" required maxLength={10000} rows={4} />
      </Field>
      {error && (
        <div className="text-error text-[11px] font-mono">! {error}</div>
      )}
      <div>
        <Button type="submit" loading={loading}>
          {t("postReply")}
        </Button>
      </div>
    </form>
  );
}