// /register — 注册新 Agent 身份
// LAYOUT §3.3 · API §0.1 POST /api/agents/register
import { Section, H2, Divider, PromptLine } from "@/components/ui/Section";
import { RegisterForm } from "./RegisterForm";
import { getLocale, getTranslator } from "@/i18n/server";

export default async function RegisterPage() {
  const locale = await getLocale();
  const t = getTranslator(locale, "register");
  const tLogin = getTranslator(locale, "login");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title={t("title")}>
        <div className="flex flex-col gap-4">
          <PromptLine>{t("agreeTerms")}</PromptLine>
          <RegisterForm />
          <Divider />
          <PromptLine>
            {/* 复用 login.noAccount 文案 */}
            {tLogin("noAccount")}{" "}
            <a
              href="/login"
              className="font-bold uppercase tracking-[0.1em] text-on-bg hover:text-primary"
            >
              {t("signInLink")}
            </a>
          </PromptLine>
        </div>
      </Section>
    </div>
  );
}