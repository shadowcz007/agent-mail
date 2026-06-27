"use client";

// Agent 一键接入 — register page 替代入口
// 用户已有 Agent 时,把"提示词"复制到 Agent 对话窗口,让 Agent 帮忙完成注册 + 接入。
//
// 提示词结构(2 段):
//   段 1:主命令 — 使用 agently-mail 确认邮箱 + 浏览器打开 /?register=<mail>
//   段 2:兜底 — 若 agently-mail 未安装,引导阅读 CLI setup 文档
//
// 邮箱来源优先级:
//   1. props.email(register page 从 ?email= query param 传入)
//   2. props.mailPlaceholder(从 i18n 取的 <your-email@agent.qq.com> 占位)
//
// 装饰符约定(SPEC §3.8.1):仅用 // / [ > ] / ( DONE ) / `code`,无 emoji
// 模态框:全屏 overlay + 中央卡片,点 backdrop 关闭,ESC 关闭,复制成功显示 ( DONE )
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

interface Props {
  /** 预填邮箱(从 /register?email= 传入),用于替换 <mail> 占位 */
  email?: string;
}

export function AgentQuickAccessButton({ email }: Props) {
  const t = useT("agentQuickAccess");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算 prompt 文本(根据 email 替换 <mail>)
  const mail = email?.trim() || t("mailPlaceholder");
  const registerUrl = `https://agent-mail.mixlab.top/?register=${encodeURIComponent(mail)}`;
  const prompt = [
    `使用腾讯官方\`agently-mail\`，来确认已登录状态的邮箱地址 ${mail}，浏览器打开 \`${registerUrl}\``,
    "",
    `如果没有安装\`agently-mail\`，需要初始化：请阅读 https://agent.qq.com/doc/cli-setup.md 文档，按照步骤安装并配置 Agent Mail CLI。`,
  ].join("\n");

  // ESC 关闭模态框
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onCopy() {
    setError(null);
    if (!navigator.clipboard?.writeText) {
      setError(t("clipboardUnavailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t("openButton")}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("modalTitle")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-bg/70 p-4"
          onClick={() => setOpen(false)}
        >
          {/* 阻止冒泡,避免点卡片内容时关闭 */}
          <div
            className="border border-outline bg-bg text-on-bg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="bg-primary text-on-primary px-3 py-1.5 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono">
                // {t("modalTitle")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:text-accent"
                aria-label="close"
              >
                [ X ]
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {/* 引导提示 */}
              <p className="text-[13px] font-mono leading-relaxed text-on-bg">
                {t("hint")}
              </p>

              {/* 提示词 pre block — 等宽字体 + 自动换行 */}
              <pre className="border border-outline-variant bg-bg/50 p-3 text-[12px] font-mono whitespace-pre-wrap break-words text-on-bg">
                {prompt}
              </pre>

              {/* 错误提示 */}
              {error && (
                <div className="text-[11px] font-mono text-error before:content-['!_'] before:mr-1">
                  {error}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-2">
                <Button variant="primary" onClick={onCopy}>
                  {copied ? t("copied") : t("copyButton")}
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}