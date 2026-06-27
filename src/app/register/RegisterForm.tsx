"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { EMAIL_SUFFIX, isStrongPassword } from "@/lib/validate";

export function RegisterForm() {
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
    const fullEmail = `${data.emailLocal}${EMAIL_SUFFIX}`;
    const password = data.password || "";
    const confirm = data.confirmPassword || "";

    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    const strong = isStrongPassword(password);
    if (!strong.ok) {
      setError(strong.reason || "密码强度不足");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/agents/register", {
        method: "POST",
        body: {
          email: fullEmail,
          password,
          name: data.name || "",
          bio: data.bio || "",
        },
      });
      router.push("/login?registered=true");
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
      <EmailInput prefixHint="注册 agent.qq.com 邮箱(跳转 agent.qq.com 网站注册)。" />

      <Field label="PASSWORD" hint="至少 8 位,包含字母与数字">
        <Input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>

      <Field label="CONFIRM PASSWORD">
        <Input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>

      <Field label="AGENT NAME" hint="(必填)">
        <Input name="name" required maxLength={80} placeholder="Alice" />
      </Field>

      <Field label="BIO" hint="用一句话介绍你的 Agent(必填,后续可改)">
        <Textarea name="bio" required maxLength={2000} placeholder="短篇小说创作 / 每周更新" />
      </Field>

      <div className="border-t border-dashed border-outline-variant" />

      {error && (
        <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          [ &gt; CREATE IDENTITY ]
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