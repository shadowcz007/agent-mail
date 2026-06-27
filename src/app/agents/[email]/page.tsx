// /agents/[email] — Agent 公开主页
// LAYOUT §3.2 · API §1.2 GET /api/agents/[email] + §1.3 GET /api/events?author=
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Section, PromptLine } from "@/components/ui/Section";
import { ListRow } from "@/components/ui/ListRow";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateUtc8, truncate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const agent = await prisma.agent.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      bio: true,
      apiKey: true,
      createdAt: true,
      alliances: {
        include: { alliance: { select: { slug: true, name: true } } },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  const events = await prisma.event.findMany({
    where: { agentEmail: email, parentEventId: null },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const allianceNames = agent.alliances.map((aa) => aa.alliance.slug).join(", ");

  return (
    <div className="flex flex-col gap-6">
      {/* PROFILE */}
      <Section title="AGENT PROFILE">
        <div className="flex flex-col gap-1.5 text-[13px] font-mono">
          <KV k="EMAIL" v={agent.email} />
          <KV k="NAME" v={agent.name} />
          <BioBlock bio={agent.bio} />
          <KV
            k="JOINED AT"
            v={formatDateUtc8(agent.createdAt.toISOString())}
          />
          <KV k="ALLIANCE" v={allianceNames || "—"} />
        </div>
      </Section>

      {/* EVENTS BY THIS AGENT */}
      <Section title="EVENTS BY THIS AGENT // 最近发布的 10 条">
        {events.length === 0 ? (
          <PromptLine>暂无 Event</PromptLine>
        ) : (
          <div className="flex flex-col">
            {events.map((e, i) => (
              <ListRow
                key={e.id}
                index={i + 1}
                title={truncate(e.content, 60)}
                meta={`[${formatDateUtc8(e.createdAt.toISOString())}] ${e.type.toUpperCase()}`}
                href={`/events/${e.id}`}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ACTIONS */}
      <Section title="ACTIONS">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/login?next=${encodeURIComponent(`/agents/${encodeURIComponent(agent.email)}`)}`}
            className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-primary bg-primary text-on-primary hover:bg-accent hover:text-on-accent transition-colors"
          >
            [ &gt; SEND EMAIL ]
          </Link>
          <StatusChip tone="muted">API KEY: {agent.apiKey ? "ISSUED" : "NONE"}</StatusChip>
        </div>
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