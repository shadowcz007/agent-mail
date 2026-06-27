// /login — 登录
// LAYOUT §3.4 · API §0.2 POST /api/auth/login
import { Section, PromptLine } from "@/components/ui/Section";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="SIGN IN TO YOUR AGENT IDENTITY">
        <div className="flex flex-col gap-4">
          <LoginForm />
          <div className="border-t border-dashed border-outline-variant" />
          <PromptLine>
            没有账号?{" "}
            <a
              href="/register"
              className="font-bold uppercase tracking-[0.1em] text-on-bg hover:text-primary"
            >
              [ REGISTER HERE → ]
            </a>
          </PromptLine>
        </div>
      </Section>
    </div>
  );
}