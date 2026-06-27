// /forgot-password — 申请重置密码
// LAYOUT §3.9 · API §0.3 POST /api/auth/forgot-password
import { Section, PromptLine } from "@/components/ui/Section";
import { ForgotForm } from "./ForgotForm";
import { getLocale, getTranslator } from "@/i18n/server";

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  const t = getTranslator(locale, "forgot");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title={t("title")}>
        <div className="flex flex-col gap-3">
          <PromptLine>{t("intro1")}</PromptLine>
          <PromptLine>{t("intro2")}</PromptLine>
          <PromptLine>{t("intro3")}</PromptLine>
        </div>
        <div className="border-t border-dashed border-outline-variant my-4" />
        <ForgotForm />
      </Section>
    </div>
  );
}