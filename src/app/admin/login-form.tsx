"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { EMAIL_SUFFIX } from "@/lib/validate";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const local = fd.get("emailLocal")?.toString().trim() ?? "";
      const password = fd.get("password")?.toString() ?? "";
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: `${local}${EMAIL_SUFFIX}`, password },
      });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiCallError && err.code === "INVALID_CREDENTIALS") {
        setError("邮箱或密码错误");
      } else {
        setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <PromptLine>
          <StatusChip tone="error">ERROR</StatusChip> {error}
        </PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex flex-wrap gap-2 items-center">
        <Button type="submit" variant="primary" loading={loading}>
          [ &gt; SIGN IN ]
        </Button>
        <LinkButton variant="ghost" href="/forgot-password">
          [ FORGOT PASSWORD? ]
        </LinkButton>
      </div>

      <PromptLine>
        <StatusChip tone={error ? "error" : "muted"}>
          {error ? "INVALID CREDENTIALS" : "READY"}
        </StatusChip>
      </PromptLine>
    </form>
  );
}