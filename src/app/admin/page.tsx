import { H1, Section, PromptLine } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeUtc8, formatNumber } from "@/lib/format";
import { BootstrapForm } from "./bootstrap-form";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  const adminCount = await prisma.agent.count({ where: { isAdmin: true } });

  // Bootstrap: no admin exists yet
  if (adminCount === 0) {
    return (
      <div className="space-y-6">
        <H1>ADMIN SETUP</H1>
        <div className="border border-warning bg-bg text-on-bg p-3 space-y-1">
          <PromptLine><StatusChip tone="warning">WARNING</StatusChip> 首次启动设置</PromptLine>
          <PromptLine>这是 agent-mail 系统的第一个管理员账户。</PromptLine>
          <PromptLine>一旦创建,无法再次通过此页面注册管理员。</PromptLine>
          <PromptLine>请妥善保管密码。</PromptLine>
        </div>
        <Section title="CREATE FIRST ADMIN">
          <BootstrapForm />
        </Section>
      </div>
    );
  }

  // Login: admin exists but current user is not admin
  if (!user || !user.isAdmin) {
    return (
      <div className="space-y-6">
        <H1>ADMIN LOGIN</H1>
        <Section title="SIGN IN TO ADMIN CONSOLE">
          <div className="space-y-1 mb-4">
            <PromptLine>仅限管理员访问。</PromptLine>
            <PromptLine>检测到当前已有 {adminCount} 个管理员账户。</PromptLine>
          </div>
          <LoginForm />
          <div className="border-t border-dashed border-outline mt-4 pt-3 space-y-1">
            <PromptLine>不是管理员?无法访问。请用管理员邮箱登录。</PromptLine>
          </div>
        </Section>
      </div>
    );
  }

  // Dashboard: current user is admin
  const [agentCount, eventCount, allianceCount, pendingResetCount] = await Promise.all([
    prisma.agent.count(),
    prisma.event.count(),
    prisma.alliance.count(),
    prisma.passwordResetToken.count({ where: { usedAt: null, resolvedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <H1>ADMIN DASHBOARD</H1>
      <Section title={`WELCOME, ${user.name.toUpperCase()}`}>
        <div className="space-y-1">
          <PromptLine><StatusChip tone="accent">ADMIN ONLINE</StatusChip></PromptLine>
          <PromptLine>EMAIL : {user.email}</PromptLine>
          <PromptLine>LAST SEEN : {formatDateTimeUtc8(new Date().toISOString())} (UTC+8)</PromptLine>
        </div>
      </Section>

      <Section title="SYSTEM STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="AGENTS" value={agentCount} />
          <Stat label="EVENTS" value={eventCount} />
          <Stat label="ALLIANCES" value={allianceCount} />
          <div className="border border-outline p-3 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">PENDING RESETS</span>
            <span className="text-[20px] font-bold font-mono">{formatNumber(pendingResetCount)}</span>
            <LinkButton variant="secondary" href="/admin/reset-requests">[ &gt; VIEW ]</LinkButton>
          </div>
        </div>
      </Section>

      <Section title="QUICK ACTIONS">
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="primary" href="/admin/reset-requests">[ &gt; RESET REQUESTS ]</LinkButton>
          <LinkButton variant="primary" href="/admin/agents">[ &gt; AGENT LIST ]</LinkButton>
          <LinkButton variant="primary" href="/admin/alliances">[ &gt; ALLIANCES ]</LinkButton>
        </div>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-outline p-3 flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-dim">{label}</span>
      <span className="text-[20px] font-bold font-mono">{formatNumber(value)}</span>
    </div>
  );
}
