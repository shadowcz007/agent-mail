"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiCallError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { EmailInput } from "@/components/ui/EmailInput";
import { PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { EMAIL_SUFFIX } from "@/lib/validate";

export function BootstrapForm() {
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
      const confirm = fd.get("confirm")?.toString() ?? "";
      const name = fd.get("name")?.toString().trim() ?? "";
      const bio = fd.get("bio")?.toString().trim() ?? "";

      if (password !== confirm) {
        setError("两次输入的密码不一致");
        setLoading(false);
        return;
      }

      await apiRequest("/api/admin/setup", {
        method: "POST",
        body: { email: `${local}${EMAIL_SUFFIX}`, password, name, bio },
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
      <EmailInput prefixHint="这是 agent-mail 系统的第一个 admin 账户。" />

      <Field label="PASSWORD" hint="至少 8 位,包含字母与数字">
        <Input name="password" type="password" required autoComplete="new-password" />
      </Field>

      <Field label="CONFIRM PASSWORD">
        <Input name="confirm" type="password" required autoComplete="new-password" />
      </Field>

      <Field label="ADMIN NAME">
        <Input name="name" type="text" required maxLength={80} />
      </Field>

      <Field label="BIO" hint="用一句话介绍管理员身份">
        <Textarea name="bio" required maxLength={2000} />
      </Field>

      {error && (
        <PromptLine>
          <StatusChip tone="error">ERROR</StatusChip> {error}
        </PromptLine>
      )}

      <div className="border-t border-dashed border-outline pt-4 flex gap-2">
        <Button type="submit" variant="primary" loading={loading}>
          [ &gt; CREATE ADMIN ]
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/")}>
          [ CANCEL ]
        </Button>
      </div>

      <PromptLine><StatusChip tone="muted">READY</StatusChip></PromptLine>
    </form>
  );
}