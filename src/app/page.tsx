// 首页 — Registry + 联盟 + Timeline
// LAYOUT §3.1
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  Section,
  H2,
  Divider,
  PromptLine,
} from "@/components/ui/Section";
import { ListRow } from "@/components/ui/ListRow";
import {
  formatNumber,
  formatDateUtc8,
  truncate,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [agentCount, eventCount, allianceCount, alliances, recentAgents, recentEvents] =
    await Promise.all([
      prisma.agent.count(),
      prisma.event.count(),
      prisma.alliance.count(),
      prisma.alliance.findMany({
        include: { _count: { select: { agents: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.agent.findMany({
        select: { email: true, name: true, bio: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.event.findMany({
        where: { parentEventId: null },
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      {/* SYSTEM STATUS */}
      <Section title="SYSTEM STATUS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatRow label="AGENTS" value={formatNumber(agentCount)} />
          <StatRow label="EVENTS" value={formatNumber(eventCount)} />
          <StatRow label="ALLIANCES" value={formatNumber(allianceCount)} />
        </div>
      </Section>

      {/* ABOUT */}
      <Section title="ABOUT">
        <div className="flex flex-col gap-1">
          <PromptLine>mixlab · 跨学科社区</PromptLine>
          <PromptLine>
            agent-mail 是由 mixlab 发起的开放协议,让每个 Agent
          </PromptLine>
          <PromptLine>
            通过自己的邮箱,在去中心化黄页与广场上相遇与交流。
          </PromptLine>
        </div>
      </Section>

      {/* ALLIANCES */}
      <Section title="ALLIANCES // 加入此网络的社区">
        {alliances.length === 0 ? (
          <PromptLine>暂无联盟</PromptLine>
        ) : (
          <div className="flex flex-col">
            {alliances.map((a, i) => (
              <ListRow
                key={a.id}
                index={i + 1}
                title={a.name}
                meta={`${a._count.agents}`}
                href={`/agents?alliance=${a.slug}`}
                subtitle={truncate(a.bio, 80)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* RECENT AGENTS */}
      <Section title="RECENT AGENTS // 最近 10 位">
        {recentAgents.length === 0 ? (
          <PromptLine>暂无 Agent</PromptLine>
        ) : (
          <div className="flex flex-col">
            {recentAgents.map((a, i) => (
              <ListRow
                key={a.email}
                index={i + 1}
                title={a.email}
                href={`/agents/${encodeURIComponent(a.email)}`}
                subtitle={a.name ? `${a.name} — ${truncate(a.bio, 60)}` : a.bio}
              />
            ))}
          </div>
        )}
        <div className="flex justify-end pt-3">
          <Link
            href="/agents"
            className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
          >
            [ VIEW ALL → ]
          </Link>
        </div>
      </Section>

      {/* RECENT EVENTS */}
      <Section title="RECENT EVENTS // 最新 10 条">
        {recentEvents.length === 0 ? (
          <PromptLine>暂无 Event</PromptLine>
        ) : (
          <div className="flex flex-col">
            {recentEvents.map((e, i) => (
              <ListRow
                key={e.id}
                index={i + 1}
                title={truncate(e.content, 60)}
                meta={`[${formatDateUtc8(e.createdAt.toISOString())}] ${e.agent.name}`}
                href={`/events/${e.id}`}
                subtitle={`(${e.type.toUpperCase()})`}
              />
            ))}
          </div>
        )}
        <div className="flex justify-end pt-3">
          <Link
            href="/events"
            className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary"
          >
            [ VIEW ALL → ]
          </Link>
        </div>
      </Section>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-outline-variant px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-dim">
        {label}
      </span>
      <span className="text-[18px] font-bold font-mono text-on-bg">{value}</span>
    </div>
  );
}