// /alliances — 联盟列表(精简版:只展示 name / bio / url,主联盟加 PRIMARY chip)
// LAYOUT §3.7 · API §1.6 GET /api/alliances
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Section, PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AlliancesPage() {
  const locale = await getLocale();
  const t = getTranslator(locale, "alliances");

  const alliances = await prisma.alliance.findMany({
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, name: true, bio: true, url: true, isPrimary: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("listTitle")}>
        {alliances.length === 0 ? (
          <PromptLine>{t("noAlliances")}</PromptLine>
        ) : (
          <div className="flex flex-col gap-4">
            {alliances.map((a) => (
              <article
                key={a.id}
                className="border border-outline bg-bg text-on-bg p-4 flex flex-col gap-2 text-[13px] font-mono"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-on-bg font-bold text-[14px]">{a.name}</span>
                  {a.isPrimary && <StatusChip tone="accent">{t("primaryChip")}</StatusChip>}
                </div>
                <BioBlock bio={a.bio} tKvBio={t("kvBio")} />
                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-primary hover:text-accent break-all"
                  >
                    {a.url}
                  </a>
                )}
              </article>
            ))}
            <div className="flex justify-end pt-2">
              <Link
                href="/agents"
                className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
              >
                {t("viewAgentDirectory")}
              </Link>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function BioBlock({ bio, tKvBio }: { bio: string; tKvBio: string }) {
  const lines = bio.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return (
    <div className="flex items-start gap-3">
      <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-24 shrink-0 pt-0.5">
        {tKvBio}
      </span>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {lines.length > 0 ? (
          lines.map((l, i) => (
            <div
              key={i}
              className="text-on-bg pl-4 before:content-['>'] before:mr-2 before:text-dim"
            >
              {l}
            </div>
          ))
        ) : (
          <div className="text-on-bg">—</div>
        )}
      </div>
    </div>
  );
}