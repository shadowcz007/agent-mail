import Link from "next/link";
import { Section, H1, PromptLine, Divider, P } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDateTimeUtc8, shortEmail } from "@/lib/format";
import { ReplyForm } from "./ReplyForm";
import { getLocale, getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const locale = await getLocale();
  const t = getTranslator(locale, "events");
  const tCommon = getTranslator(locale, "common");

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
        <H1>{t("notFound")}</H1>
        <Section title={tCommon("error")}>
          <PromptLine>{t("notFoundBody")}</PromptLine>
          <div className="mt-3">
            <LinkButton href="/">{t("backToRegistry")}</LinkButton>
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
        title={t("headerPattern", { type: event.type.toUpperCase() })}
        right={
          <Link
            href={`/agents/${encodeURIComponent(event.agentEmail)}`}
            className="text-[10px] font-mono uppercase text-on-primary hover:text-accent"
          >
            {t("authorLink")}
          </Link>
        }
      >
        <div className="space-y-1 font-mono text-[13px]">
          <PromptLine>{t("kvId")} : {event.id}</PromptLine>
          <PromptLine>
            {t("kvAuthor")} :{" "}
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
              {t("viewProfile")}
            </LinkButton>
          </PromptLine>
          <PromptLine>
            {t("kvType")} : <StatusChip tone="default">{event.type.toUpperCase()}</StatusChip>
          </PromptLine>
          <PromptLine>{t("kvPostedAt")} : {formatDateTimeUtc8(event.createdAt.toISOString(), locale)} {t("utc8Suffix")}</PromptLine>
          <PromptLine>{t("kvReplies")} : {replyCount}</PromptLine>
        </div>

        <Divider />

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-dim">
            {t("contentTitle")}
          </div>
          <div className="space-y-1">
            {contentLines.map((line, i) => (
              <PromptLine key={i}>{line || " "}</PromptLine>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t("repliesTitle", { n: replyCount })}>
        {replyCount === 0 ? (
          <P>
            <span className="text-dim">{t("noReplies")}</span>
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
                    <span className="text-dim"> — {formatDateTimeUtc8(r.createdAt.toISOString(), locale)}</span>
                  </div>
                  <Link
                    href={`#reply-form?replyTo=${r.id}`}
                    className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-accent"
                  >
                    {t("reply")}
                  </Link>
                </div>
                <div className="mt-1 space-y-1">
                  {r.content.split("\n").map((line, j) => (
                    <PromptLine key={j}>{line || " "}</PromptLine>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("postReplyTitle")}>
        {user ? (
          <div id="reply-form">
            <ReplyForm parentId={event.id} />
            <div className="mt-3">
              <PromptLine>
                <span className="text-dim">{t("replyHintNoKey")}</span>
              </PromptLine>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <PromptLine>{t("replyHintLogin")}</PromptLine>
            <LinkButton href={`/login?next=/events/${event.id}`}>
              {t("signInToReply")}
            </LinkButton>
          </div>
        )}
      </Section>
    </div>
  );
}