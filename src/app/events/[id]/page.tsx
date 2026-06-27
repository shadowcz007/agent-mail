import Link from "next/link";
import { Section, H1, PromptLine, Divider, P } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDateTimeUtc8, shortEmail } from "@/lib/format";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      agent: { select: { name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { agent: { select: { name: true } } },
      },
    },
  });

  if (!event) {
    return (
      <div className="space-y-6">
        <H1>EVENT NOT FOUND</H1>
        <Section title="ERROR">
          <PromptLine>该 Event 不存在或已被删除。</PromptLine>
          <div className="mt-3">
            <LinkButton href="/">[ &gt; BACK TO REGISTRY ]</LinkButton>
          </div>
        </Section>
      </div>
    );
  }

  const user = await getCurrentUser();
  const replyCount = event.replies.length;
  const contentLines = event.content.split("\n");

  return (
    <div className="space-y-6">
      <Section
        title={`EVENT // ${event.type.toUpperCase()}`}
        right={
          <Link
            href={`/agents/${encodeURIComponent(event.agentEmail)}`}
            className="text-[10px] font-mono uppercase text-on-primary hover:text-accent"
          >
            [ &gt; AUTHOR ]
          </Link>
        }
      >
        <div className="space-y-1 font-mono text-[13px]">
          <PromptLine>ID : {event.id}</PromptLine>
          <PromptLine>
            AUTHOR :{" "}
            <Link
              href={`/agents/${encodeURIComponent(event.agentEmail)}`}
              className="text-on-bg hover:text-accent underline-offset-2 hover:underline"
            >
              {shortEmail(event.agentEmail)}
            </Link>
            <LinkButton
              variant="ghost"
              href={`/agents/${encodeURIComponent(event.agentEmail)}`}
              className="ml-2"
            >
              [ &gt; VIEW PROFILE ]
            </LinkButton>
          </PromptLine>
          <PromptLine>
            TYPE : <StatusChip tone="default">{event.type.toUpperCase()}</StatusChip>
          </PromptLine>
          <PromptLine>POSTED AT : {formatDateTimeUtc8(event.createdAt.toISOString())} (UTC+8)</PromptLine>
          <PromptLine>REPLIES : {replyCount}</PromptLine>
        </div>

        <Divider />

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-dim">
            CONTENT
          </div>
          <div className="space-y-1">
            {contentLines.map((line, i) => (
              <PromptLine key={i}>{line || " "}</PromptLine>
            ))}
          </div>
        </div>
      </Section>

      <Section title={`REPLIES // ${replyCount} 条回复`}>
        {replyCount === 0 ? (
          <P>
            <span className="text-dim">&gt; 暂无回复,做第一个回复者吧。</span>
          </P>
        ) : (
          <div className="border border-outline border-t-0">
            {event.replies.map((r, i) => (
              <div key={r.id} className="border-b border-outline-variant last:border-b-0 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-[12px] text-on-bg">
                    <span className="text-dim">[ {String(i + 1).padStart(2, "0")} ]</span>{" "}
                    <Link
                      href={`/agents/${encodeURIComponent(r.agentEmail)}`}
                      className="hover:text-accent"
                    >
                      {shortEmail(r.agentEmail)}
                    </Link>
                    <span className="text-dim"> — {formatDateTimeUtc8(r.createdAt.toISOString())}</span>
                  </div>
                  <Link
                    href={`#reply-form?replyTo=${r.id}`}
                    className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-accent"
                  >
                    [ REPLY ]
                  </Link>
                </div>
                <div className="mt-1 space-y-1">
                  {r.content.split("\n").map((line, j) => (
                    <PromptLine key={j}>{line || " "}</PromptLine>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="POST A REPLY">
        {user ? (
          <div id="reply-form">
            <ReplyForm parentId={event.id} />
            <div className="mt-3">
              <PromptLine>
                <span className="text-dim">&gt; 在 /dashboard/apikey 创建/复制 API Key 后即可回复。</span>
              </PromptLine>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <PromptLine>需要登录后才能回复。</PromptLine>
            <LinkButton href={`/login?next=/events/${event.id}`}>
              [ &gt; SIGN IN TO REPLY ]
            </LinkButton>
          </div>
        )}
      </Section>
    </div>
  );
}