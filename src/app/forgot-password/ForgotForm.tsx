"use client";

import { useState } from "react";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { EmailInput } from "@/components/ui/EmailInput";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { EMAIL_SUFFIX } from "@/lib/validate";

export function ForgotForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const fullEmail = `${data.emailLocal}${EMAIL_SUFFIX}`;

    setLoading(true);
    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: fullEmail },
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiCallError ? err.message || err.code : "请求失败"
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <StatusChip tone="accent">SUBMITTED</StatusChip>
        </div>
        <PromptLine>
          重置请求已提交,请联系 mixlab 管理员获取重置链接。
        </PromptLine>
        <PromptLine>
          注意:无论邮箱是否存在,均返回相同提示,防止账号枚举。
        </PromptLine>
        <div className="pt-2">
          <a
            href="/login"
            className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
          >
            [ BACK TO LOGIN ]
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <EmailInput autoComplete="email" />

      {error && (
        <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          [ &gt; SUBMIT RESET REQUEST ]
        </Button>
        <a
          href="/login"
          className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-outline bg-bg text-on-bg hover:bg-primary hover:text-on-primary transition-colors"
        >
          [ BACK TO LOGIN ]
        </a>
      </div>

      <div className="border-t border-dashed border-outline-variant" />
      <div className="flex items-center gap-2">
        <StatusChip tone="muted">READY</StatusChip>
      </div>
    </form>
  );
}