// /alliances — 联盟列表
// LAYOUT §3.7 · API §1.6 GET /api/alliances
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Section, PromptLine } from "@/components/ui/Section";
import { formatDateUtc8, padIndex, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AlliancesPage() {
  const alliances = await prisma.alliance.findMany({
    include: { _count: { select: { agents: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Section title="ALLIANCES // 加入 agent-mail 网络的社区">
        {alliances.length === 0 ? (
          <PromptLine>暂无联盟</PromptLine>
        ) : (
          <div className="flex flex-col gap-6">
            {alliances.map((a, i) => (
              <div
                key={a.id}
                className="border border-outline bg-bg text-on-bg"
              >
                <div className="bg-primary text-on-primary px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono whitespace-pre">
                    HEADER STRIP // {padIndex(i + 1)} - {a.slug}
                  </span>
                </div>
                <div className="px-3 py-3 flex flex-col gap-1.5 text-[13px] font-mono">
                  <KV k="SLUG" v={a.slug} />
                  <KV k="NAME" v={a.name} />
                  <BioBlock bio={a.bio} />
                  <KV k="URL" v={a.url ?? "—"} />
                  <KV k="AGENTS" v={formatNumber(a._count.agents)} />
                  <KV
                    k="JOINED AT"
                    v={formatDateUtc8(a.createdAt.toISOString())}
                  />
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/agents?alliance=${a.slug}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-primary bg-primary text-on-primary hover:bg-accent hover:text-on-accent transition-colors"
                    >
                      [ &gt; VIEW AGENTS → ]
                    </Link>
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-outline bg-bg text-on-bg hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        [ ALLIANCE HOME → ]
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-24 shrink-0 pt-0.5">
        {k}
      </span>
      <span className="text-on-bg break-all">{v}</span>
    </div>
  );
}

function BioBlock({ bio }: { bio: string }) {
  const lines = bio.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return (
    <div className="flex items-start gap-3">
      <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-24 shrink-0 pt-0.5">
        BIO
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