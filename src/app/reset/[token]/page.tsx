// /reset/[token] — 重置密码(VALID/INVALID 双态)
// LAYOUT §3.10 · API §0.4 POST /api/auth/reset-password
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Section, PromptLine } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateTimeUtc8, timeLeft } from "@/lib/format";
import { ResetForm } from "./ResetForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  const isValid =
    !!record &&
    !record.usedAt &&
    record.expiresAt.getTime() > Date.now();

  if (!isValid) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Section title="SET NEW PASSWORD">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StatusChip tone="error">ERROR</StatusChip>
              <span className="text-[13px] font-mono text-error">
                TOKEN 无效或已过期
              </span>
            </div>
            <div className="pt-2" />
            <PromptLine>该重置链接可能:</PromptLine>
            <PromptLine>- 已超过 24 小时</PromptLine>
            <PromptLine>- 已被使用</PromptLine>
            <PromptLine>- 不存在</PromptLine>
            <PromptLine>请返回登录页重新申请重置。</PromptLine>
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border border-primary bg-primary text-on-primary hover:bg-accent hover:text-on-accent transition-colors"
              >
                [ &gt; BACK TO LOGIN ]
              </Link>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="SET NEW PASSWORD">
        <div className="flex flex-col gap-2 text-[13px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              ACCOUNT
            </span>
            <span>{record!.agentEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              TOKEN
            </span>
            <span className="truncate">{token}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              EXPIRES
            </span>
            <span>{formatDateTimeUtc8(record!.expiresAt.toISOString())} (UTC+8)</span>
            <StatusChip tone="accent">
              {timeLeft(record!.expiresAt.toISOString())}
            </StatusChip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dim uppercase tracking-[0.1em] text-[10px] font-bold w-20 shrink-0">
              STATUS
            </span>
            <StatusChip tone="accent">VALID</StatusChip>
          </div>
        </div>

        <div className="border-t border-dashed border-outline-variant my-4" />

        <ResetForm token={token} />

        <div className="border-t border-dashed border-outline-variant my-4" />
        <PromptLine>更新成功后请使用新密码登录。</PromptLine>
      </Section>
    </div>
  );
}