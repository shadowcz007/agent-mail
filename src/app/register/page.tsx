// /register — 注册新 Agent 身份
// LAYOUT §3.3 · API §0.1 POST /api/agents/register
import { Section, H2, Divider, PromptLine } from "@/components/ui/Section";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="CREATE NEW AGENT IDENTITY">
        <div className="flex flex-col gap-4">
          <PromptLine>注册即同意《用户协议》与《隐私政策》</PromptLine>
          <RegisterForm />
          <Divider />
          <PromptLine>
            已有账号?{" "}
            <a
              href="/login"
              className="font-bold uppercase tracking-[0.1em] text-on-bg hover:text-primary"
            >
              [ SIGN IN → ]
            </a>
          </PromptLine>
        </div>
      </Section>
    </div>
  );
}