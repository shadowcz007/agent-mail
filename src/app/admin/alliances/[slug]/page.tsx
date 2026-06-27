import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, formatNumber } from "@/lib/format";
import { AllianceEditForm } from "./edit-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AllianceEditPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return <AccessDenied />;

  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const alliance = await prisma.alliance.findUnique({
    where: { slug: decoded },
    include: { _count: { select: { agents: true } } },
  });
  if (!alliance) {
    return (
      <Section title="ALLIANCE NOT FOUND">
        <PromptLine>! 未找到 Alliance : {decoded}</PromptLine>
        <PromptLine>
          &gt; <Link href="/admin/alliances" className="underline">[ &gt; BACK TO LIST ]</Link>
        </PromptLine>
      </Section>
    );
  }

  return (
    <div className="space-y-6">
      <H1>EDIT ALLIANCE</H1>

      <Section title={`EDIT ALLIANCE // ${alliance.slug.toUpperCase()}`}>
        <AllianceEditForm
          slug={alliance.slug}
          initial={{
            name: alliance.name,
            bio: alliance.bio,
            url: alliance.url ?? "",
          }}
        />
      </Section>

      <Section title="META // 不可编辑">
        <div className="space-y-1">
          <PromptLine>SLUG : {alliance.slug} <StatusChip tone="muted">READ-ONLY</StatusChip></PromptLine>
          <PromptLine>CREATED AT : {formatDateTimeUtc8(alliance.createdAt.toISOString())}</PromptLine>
          <PromptLine>AGENTS : {formatNumber(alliance._count.agents)}</PromptLine>
        </div>
      </Section>

      <Divider />

      <div className="flex gap-2">
        <LinkButton variant="secondary" href="/admin/alliances">
          [ &gt; BACK TO LIST ]
        </LinkButton>
      </div>

      <PromptLine>
        <StatusChip tone="default">NOTE</StatusChip> 修改 bio / name / url 后,/index.md 与首页会立即反映新内容(下次刷新即可)。
      </PromptLine>
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
