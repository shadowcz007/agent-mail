import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, formatNumber } from "@/lib/format";
import { AllianceEditForm } from "./edit-form";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AllianceEditPage({ params }: PageProps) {
  const user = await getCurrentUser();

  const locale = await getLocale();
  const t = getTranslator(locale, "admin");
  const tCommon = getTranslator(locale, "common");

  if (!user || !user.isAdmin) return <AccessDenied t={t} />;

  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const alliance = await prisma.alliance.findUnique({
    where: { slug: decoded },
    include: { _count: { select: { agents: true } } },
  });
  if (!alliance) {
    return (
      <Section title={t("allianceNotFound")}>
        <PromptLine>{t("allianceNotFoundBody", { slug: decoded })}</PromptLine>
        <PromptLine>
          &gt; <Link href="/admin/alliances" className="underline">{t("allianceEditBack")}</Link>
        </PromptLine>
      </Section>
    );
  }

  return (
    <div className="space-y-6">
      <H1>{t("allianceEditTitle")}</H1>

      <Section title={t("allianceEditTitleSlug", { slug: alliance.slug.toUpperCase() })}>
        <AllianceEditForm
          slug={alliance.slug}
          locale={locale}
          initial={{
            name: alliance.name,
            bio: alliance.bio,
            url: alliance.url ?? "",
            isPrimary: alliance.isPrimary,
          }}
        />
      </Section>

      <Section title={t("allianceMetaTitle")}>
        <div className="space-y-1">
          <PromptLine>{t("allianceMetaSlugLabel")} : {alliance.slug} <StatusChip tone="muted">{t("allianceReadOnly")}</StatusChip></PromptLine>
          <PromptLine>{t("allianceMetaCreatedLabel")} : {formatDateTimeUtc8(alliance.createdAt.toISOString(), locale)}</PromptLine>
          <PromptLine>{t("allianceMetaAgentsLabel")} : {formatNumber(alliance._count.agents)}</PromptLine>
        </div>
      </Section>

      <Divider />

      <div className="flex gap-2">
        <LinkButton variant="secondary" href="/admin/alliances">
          {t("allianceEditBack")}
        </LinkButton>
      </div>

      <PromptLine>
        <StatusChip tone="default">{tCommon("note")}</StatusChip> {t("allianceEditNoteBody")}
      </PromptLine>
    </div>
  );
}

function AccessDenied({ t }: { t: ReturnType<typeof getTranslator> }) {
  return (
    <Section title={t("accessDenied")}>
      <PromptLine>{t("accessDeniedBody")}</PromptLine>
      <PromptLine>
        &gt; <Link href="/admin" className="underline">{t("accessDeniedBack")}</Link>
      </PromptLine>
    </Section>
  );
}