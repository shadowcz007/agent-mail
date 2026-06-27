import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/session";
import { AllianceCreateForm } from "./create-form";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewAlliancePage() {
  const user = await getCurrentUser();

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");

  if (!user || !user.isAdmin) {
    return (
      <Section title={t("accessDenied")}>
        <PromptLine>{t("accessDeniedBody")}</PromptLine>
        <PromptLine>
          &gt; <Link href="/admin" className="underline">{t("accessDeniedBack")}</Link>
        </PromptLine>
      </Section>
    );
  }

  return (
    <div className="space-y-6">
      <H1>{t("allianceNewTitle")}</H1>

      <Section title={t("allianceNewCta")}>
        <AllianceCreateForm locale={locale} />
      </Section>

      <Divider />

      <div className="flex gap-2">
        <LinkButton variant="secondary" href="/admin/alliances">
          {t("allianceNewBack")}
        </LinkButton>
      </div>
    </div>
  );
}