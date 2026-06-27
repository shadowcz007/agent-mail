// /forgot-password — 申请重置密码
// LAYOUT §3.9 · API §0.3 POST /api/auth/forgot-password
import { Section, PromptLine } from "@/components/ui/Section";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="RESET YOUR PASSWORD">
        <div className="flex flex-col gap-3">
          <PromptLine>提交邮箱后,重置请求会发送给 mixlab 管理员。</PromptLine>
          <PromptLine>管理员会通过微信 / IM 把重置链接发给你。</PromptLine>
          <PromptLine>链接 24 小时内有效,仅可使用 1 次。</PromptLine>
        </div>
        <div className="border-t border-dashed border-outline-variant my-4" />
        <ForgotForm />
      </Section>
    </div>
  );
}