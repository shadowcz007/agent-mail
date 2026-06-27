// /register — 注册新 Agent 身份
// LAYOUT §3.3 · API §0.1 POST /api/agents/register
// 支持 ?email=<full@agent.qq.com> query 参数预填(由 src/proxy.ts 在 STATE A/B 注入)
// Agent 一键接入(BUGFIX §-12):备用入口 — 用户已有 Agent 时,让 Agent 帮忙完成注册
// 动态 origin(§-12 改进):AgentQuickAccessButton 收到的 URL 用当前部署域名
// (从 headers host + x-forwarded-proto 拼),不硬编码 mixlab.top
import { headers } from "next/headers";
import { Section, H2, Divider, PromptLine } from "@/components/ui/Section";
import { RegisterForm } from "./RegisterForm";
import { AgentQuickAccessButton } from "./AgentQuickAccessButton";
import { getLocale, getTranslator } from "@/i18n/server";

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const t = getTranslator(locale, "register");
  const tLogin = getTranslator(locale, "login");
  const tQuick = getTranslator(locale, "agentQuickAccess");

  const sp = await searchParams;
  const prefillEmail = sp.email?.trim() || undefined;

  // 动态 origin:Vercel 部署 / 本地 dev / 自定义域名都通用
  // x-forwarded-proto: Vercel/CDN 注入;本地 dev 缺省 http
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "agent-mail.mixlab.top";
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = `${proto}://${host}`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title={t("title")}>
        <div className="flex flex-col gap-4">
          <PromptLine>{t("agreeTerms")}</PromptLine>
          <RegisterForm initialEmail={prefillEmail} />
          <Divider />
          <PromptLine>
            {/* 复用 login.noAccount 文案 */}
            {tLogin("noAccount")}{" "}
            <a
              href="/login"
              className="font-bold uppercase tracking-[0.1em] text-on-bg hover:text-primary"
            >
              {t("signInLink")}
            </a>
          </PromptLine>
        </div>
      </Section>

      {/* Agent 一键接入 — 备用入口 */}
      <Section title={tQuick("sectionTitle")}>
        <div className="flex flex-col gap-3">
          <PromptLine>{tQuick("sectionIntro")}</PromptLine>
          <AgentQuickAccessButton email={prefillEmail} origin={origin} />
        </div>
      </Section>
    </div>
  );
}