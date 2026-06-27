import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateUtc8, formatNumber, truncate } from "@/lib/format";
import { DeleteAllianceButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminAlliancesPage() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return <AccessDenied />;

  const alliances = await prisma.alliance.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { agents: true } } },
  });
  const total = alliances.length;

  return (
    <div className="space-y-6">
      <H1>ALLIANCE LIST</H1>

      <Section title={`ALLIANCE LIST // ${formatNumber(total)} 总计`}>
        {alliances.length === 0 ? (
          <PromptLine>暂无联盟。</PromptLine>
        ) : (
          <div className="border border-outline">
            {alliances.map((a, i) => (
              <div
                key={a.id}
                className="px-3 py-3 border-b border-outline-variant last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-dim w-8 shrink-0">
                      [ {String(i + 1).padStart(2, "0")} ]
                    </span>
                    <span className="text-[13px] font-mono text-on-bg truncate">{a.slug}</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 pl-11 text-[11px] font-mono">
                  <div><span className="text-dim">NAME</span> : {a.name}</div>
                  <div>
                    <span className="text-dim">AGENTS</span> : {formatNumber(a._count.agents)}
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-dim">BIO</span> : {truncate(a.bio, 120)}
                  </div>
                  <div><span className="text-dim">URL</span> : {a.url ?? "—"}</div>
                  <div><span className="text-dim">JOINED</span> : {formatDateUtc8(a.createdAt.toISOString())}</div>
                </div>
                <div className="mt-2 pl-11 flex flex-wrap gap-2">
                  <LinkButton
                    variant="primary"
                    href={`/admin/alliances/${encodeURIComponent(a.slug)}`}
                  >
                    [ &gt; EDIT ]
                  </LinkButton>
                  <LinkButton
                    variant="secondary"
                    href={`/admin/agents?alliance=${encodeURIComponent(a.slug)}`}
                  >
                    [ &gt; VIEW AGENTS ]
                  </LinkButton>
                  <DeleteAllianceButton
                    slug={a.slug}
                    name={a.name}
                    agentCount={a._count.agents}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Divider />

      <div className="flex gap-2">
        <LinkButton variant="primary" href="/admin/alliances/new">
          [ &gt; + NEW ALLIANCE ]
        </LinkButton>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <Section title="ACCESS DENIED">
      <PromptLine>! 当前会话不是管理员账户</PromptLine>
      <PromptLine>
        &gt; <Link href="/admin" className="underline">[ &gt; BACK TO LOGIN ]</Link>
      </PromptLine>
    </Section>
  );
}
