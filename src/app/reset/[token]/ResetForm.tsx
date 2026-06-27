"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { isStrongPassword } from "@/lib/validate";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const newPassword = data.newPassword || "";
    const confirm = data.confirmPassword || "";

    if (newPassword !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    const strong = isStrongPassword(newPassword);
    if (!strong.ok) {
      setError(strong.reason || "密码强度不足");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
      });
      router.push("/login?reset=success");
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
      <Field label="NEW PASSWORD" hint="至少 8 位,包含字母与数字">
        <Input
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <Field label="CONFIRM NEW PASSWORD">
        <Input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>

      {error && (
        <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          [ &gt; UPDATE PASSWORD ]
        </Button>
        <a
          href="/login"
          className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-outline bg-bg text-on-bg hover:bg-primary hover:text-on-primary transition-colors"
        >
          [ CANCEL ]
        </a>
      </div>
    </form>
  );
}