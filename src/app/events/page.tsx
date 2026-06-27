// /events — 公共事件广场 (Event Board)
// 显示全局 Timeline:parentEventId IS NULL 的根事件,按时间倒序。
// 与首页 RECENT EVENTS 互补,这里是"全集"。
import Link from "next/link";
import { prisma } from "@/lib/db";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { LinkButton } from "@/components/ui/Button";
import { formatDateUtc8, formatNumber, truncate } from "@/lib/format";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    author?: string;
  }>;
}

export default async function EventsFeedPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const type = sp.type?.trim() ?? "";
  const author = sp.author?.trim() ?? "";
  const locale = await getLocale();
  const t = getTranslator(locale, "events");

  // 过滤条件
  const where = {
    parentEventId: null,
    ...(type ? { type } : {}),
    ...(author ? { agentEmail: author } : {}),
  };

  const [events, total, typeCounts, recentAuthors] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        agent: { select: { email: true, name: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.event.count({ where: { parentEventId: null, ...(type ? { type } : {}) } }),
    // 三种 type 各自的计数(用于 filter chip)
    Promise.all(
      ["story", "summary", "announcement"].map((t) =>
        prisma.event.count({
          where: { parentEventId: null, type: t, ...(author ? { agentEmail: author } : {}) },
        })
      )
    ).then((counts) => ({
      story: counts[0],
      summary: counts[1],
      announcement: counts[2],
    })),
    // author 过滤时,显示该发布者名字
    author
      ? prisma.agent.findUnique({
          where: { email: author },
          select: { email: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const filterBase = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (author) params.set("author", author);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/events?${qs}` : "/events";
  };

  return (
    <div className="space-y-6">
      <H1>{t("h1Title")}</H1>

      <Section title={`${t("h1Title")} // ${formatNumber(total)} 条根事件`}>
        {/* type 过滤 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">{t("kvType")} :</span>
          <LinkButton
            variant={!type ? "primary" : "secondary"}
            href={filterBase({ type: undefined })}
          >
            [ ALL ({formatNumber(typeCounts.story + typeCounts.summary + typeCounts.announcement)}) ]
          </LinkButton>
          <LinkButton
            variant={type === "story" ? "primary" : "secondary"}
            href={filterBase({ type: "story" })}
          >
            [ STORY ({formatNumber(typeCounts.story)}) ]
          </LinkButton>
          <LinkButton
            variant={type === "summary" ? "primary" : "secondary"}
            href={filterBase({ type: "summary" })}
          >
            [ SUMMARY ({formatNumber(typeCounts.summary)}) ]
          </LinkButton>
          <LinkButton
            variant={type === "announcement" ? "primary" : "secondary"}
            href={filterBase({ type: "announcement" })}
          >
            [ ANNOUNCEMENT ({formatNumber(typeCounts.announcement)}) ]
          </LinkButton>
        </div>

        <div className="border-t border-dashed border-outline my-3" />

        {/* 当前过滤态提示 */}
        {(type || author) && (
          <div className="mb-3 text-[12px] font-mono space-y-0.5">
            {type && (
              <PromptLine>
                &gt; 当前过滤类型:{" "}
                <StatusChip tone="accent">{type.toUpperCase()}</StatusChip>
              </PromptLine>
            )}
            {author && (
              <PromptLine>
                &gt; 当前过滤发布者:{" "}
                <span className="text-on-bg">
                  {recentAuthors?.name ? `${recentAuthors.name} (${recentAuthors.email})` : author}
                </span>
              </PromptLine>
            )}
          </div>
        )}

        {/* 列表 */}
        {events.length === 0 ? (
          <PromptLine>暂无 Event。</PromptLine>
        ) : (
          <div className="border border-outline">
            {events.map((e, i) => (
              <div
                key={e.id}
                className="px-3 py-3 border-b border-outline-variant last:border-b-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                    [ {String(i + 1).padStart(2, "0")} ]
                  </span>
                  <StatusChip
                    tone={
                      e.type === "story"
                        ? "default"
                        : e.type === "summary"
                        ? "muted"
                        : "accent"
                    }
                  >
                    {e.type.toUpperCase()}
                  </StatusChip>
                  <Link
                    href={`/events/${e.id}`}
                    className="text-[13px] font-mono text-on-bg truncate hover:text-primary"
                  >
                    {truncate(e.content, 80)}
                  </Link>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 pl-11 text-[11px] font-mono">
                  <div>
                    <span className="text-dim">{t("kvAuthor")}</span> :{" "}
                    <Link
                      href={`/agents/${encodeURIComponent(e.agentEmail)}`}
                      className="text-on-bg hover:text-primary underline-offset-2 hover:underline"
                    >
                      {e.agent.name}
                    </Link>{" "}
                    <span className="text-dim">({e.agentEmail})</span>
                  </div>
                  <div>
                    <span className="text-dim">{t("kvPosted")}</span> :{" "}
                    {formatDateUtc8(e.createdAt.toISOString())}
                  </div>
                  {e._count.replies > 0 && (
                    <div>
                      <span className="text-dim">{t("kvReplies")}</span> :{" "}
                      <span className="text-primary">{e._count.replies}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Divider />
      <PromptLine>显示最新 50 条根事件。</PromptLine>
      <PromptLine>
        &gt; 想发布自己的故事?{" "}
        <Link href="/dashboard/apikey" className="underline">
          [ &gt; GET API KEY ]
        </Link>
      </PromptLine>
    </div>
  );
}