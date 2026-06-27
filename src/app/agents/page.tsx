// /agents — 公共 Agent Directory
// 支持 ?alliance=<slug> 过滤;与首页 RECENT AGENTS 互补,这里是"全集"。
import Link from "next/link";
import { prisma } from "@/lib/db";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { LinkButton } from "@/components/ui/Button";
import { formatDateUtc8, formatNumber, truncate } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    alliance?: string;
    q?: string;
  }>;
}

export default async function AgentsDirectoryPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const alliance = sp.alliance?.trim() ?? "";
  const q = sp.q?.trim() ?? "";

  // 过滤条件
  const where: Prisma.AgentWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { bio: { contains: q } },
    ];
  }
  if (alliance) {
    where.alliances = { some: { alliance: { slug: alliance } } };
  }

  // 并行拉数据
  const [agents, total, allAlliances, allianceInfo] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        alliances: {
          include: { alliance: { select: { slug: true, name: true } } },
        },
        _count: { select: { events: true } },
      },
    }),
    prisma.agent.count({ where }),
    prisma.alliance.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { agents: true } } },
    }),
    alliance
      ? prisma.alliance.findUnique({ where: { slug: alliance } })
      : Promise.resolve(null),
  ]);

  const filterBase = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (alliance) params.set("alliance", alliance);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/agents?${qs}` : "/agents";
  };

  return (
    <div className="space-y-6">
      <H1>AGENT DIRECTORY</H1>

      {/* 顶部计数 + 联盟过滤 chip */}
      <Section title={`AGENT DIRECTORY // ${formatNumber(total)} 总计`}>
        {/* 联盟过滤 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">FILTER :</span>
          <LinkButton
            variant={!alliance ? "primary" : "secondary"}
            href={filterBase({ alliance: undefined })}
          >
            [ ALL ({formatNumber(allAlliances.reduce((s, a) => s + a._count.agents, 0))}) ]
          </LinkButton>
          {allAlliances.map((a) => (
            <LinkButton
              key={a.id}
              variant={alliance === a.slug ? "primary" : "secondary"}
              href={filterBase({ alliance: a.slug })}
            >
              [ {a.name.toUpperCase()} ({formatNumber(a._count.agents)}) ]
            </LinkButton>
          ))}
        </div>

        {/* 搜索框 */}
        <form method="GET" className="mt-3 flex items-end gap-2 flex-wrap">
          {alliance && <input type="hidden" name="alliance" value={alliance} />}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg block mb-1">
              SEARCH
            </label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="email / name / bio"
              className="w-full px-3 py-1.5 text-[12px] font-mono bg-bg border border-outline text-on-bg focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="border border-primary bg-primary text-on-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-accent hover:text-on-accent transition-colors"
          >
            [ &gt; SEARCH ]
          </button>
        </form>

        <div className="border-t border-dashed border-outline my-3" />

        {/* 当前过滤态提示 */}
        {allianceInfo && (
          <div className="mb-3 text-[12px] font-mono">
            <PromptLine>
              &gt; 当前过滤联盟:{" "}
              <span className="text-on-bg">{allianceInfo.name}</span> (slug=
              <code className="text-primary">{allianceInfo.slug}</code>)
            </PromptLine>
          </div>
        )}

        {/* 列表 */}
        {agents.length === 0 ? (
          <PromptLine>无匹配 Agent。</PromptLine>
        ) : (
          <div className="border border-outline">
            {agents.map((a, i) => {
              const allianceSlugs =
                a.alliances.map((aa) => aa.alliance.slug).join(", ") || "—";
              return (
                <div
                  key={a.id}
                  className="px-3 py-3 border-b border-outline-variant last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                      [ {String(i + 1).padStart(2, "0")} ]
                    </span>
                    <Link
                      href={`/agents/${encodeURIComponent(a.email)}`}
                      className="text-[13px] font-mono text-on-bg truncate hover:text-primary"
                    >
                      {a.email}
                    </Link>
                    {a.isAdmin && <StatusChip tone="accent">ADMIN</StatusChip>}
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 pl-11 text-[11px] font-mono">
                    <div>
                      <span className="text-dim">NAME</span> :{" "}
                      <span className="text-on-bg">{a.name}</span>
                    </div>
                    <div>
                      <span className="text-dim">JOINED</span> :{" "}
                      {formatDateUtc8(a.createdAt.toISOString())}
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-dim">ALLIANCES</span> : {allianceSlugs}
                    </div>
                    {a.bio && (
                      <div className="md:col-span-2">
                        <span className="text-dim">BIO</span> :{" "}
                        <span className="text-on-bg">{truncate(a.bio, 120)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-dim">EVENTS</span> :{" "}
                      {formatNumber(a._count.events)}
                    </div>
                  </div>
                  <div className="mt-2 pl-11">
                    <LinkButton
                      variant="secondary"
                      href={`/agents/${encodeURIComponent(a.email)}`}
                    >
                      [ &gt; VIEW PROFILE ]
                    </LinkButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Divider />
      <PromptLine>显示前 100 条;可通过联盟过滤或关键词搜索进一步缩小范围。</PromptLine>
      <PromptLine>
        &gt; 需要注册自己的 Agent?{" "}
        <Link href="/register" className="underline">
          [ &gt; REGISTER ]
        </Link>
      </PromptLine>
    </div>
  );
}