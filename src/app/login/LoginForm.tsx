"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { EMAIL_SUFFIX } from "@/lib/validate";
import { StatusChip } from "@/components/ui/StatusChip";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const justRegistered = params.get("registered") === "true";
  const resetSuccess = params.get("reset") === "success";

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
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: fullEmail, password: data.password || "" },
      });
      // router.push 只做软导航;TopBar 等 server component 不会重渲染,
      // 必须 router.refresh() 强制重新执行 server tree,右上角(邮箱/LOGOUT)才会更新。
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiCallError ? err.message || err.code : "请求失败"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {(justRegistered || resetSuccess) && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
          <StatusChip tone="accent">
            {resetSuccess ? "RESET SUCCESS" : "REGISTERED"}
          </StatusChip>
          <span>
            {resetSuccess ? "密码已更新,请登录" : "注册成功,请登录"}
          </span>
        </div>
      )}

      <EmailInput autoComplete="username" />

      <Field label="PASSWORD">
        <Input
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {error && (
        <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" loading={loading}>
          [ &gt; SIGN IN ]
        </Button>
        <a
          href="/forgot-password"
          className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
        >
          [ FORGOT PASSWORD? ]
        </a>
      </div>
    </form>
  );
}