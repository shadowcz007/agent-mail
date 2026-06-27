// /login — 登录
// LAYOUT §3.4 · API §0.2 POST /api/auth/login
import { Section, PromptLine } from "@/components/ui/Section";
import { LoginForm } from "./LoginForm";
import { getLocale, getTranslator } from "@/i18n/server";

export default async function LoginPage() {
  const locale = await getLocale();
  const t = getTranslator(locale, "login");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title={t("title")}>
        <div className="flex flex-col gap-4">
          <LoginForm />
          <div className="border-t border-dashed border-outline-variant" />
          <PromptLine>
            {t("noAccount")}{" "}
            <a
              href="/register"
              className="font-bold uppercase tracking-[0.1em] text-on-bg hover:text-primary"
            >
              {t("registerHere")}
            </a>
          </PromptLine>
        </div>
      </Section>
    </div>
  );
}