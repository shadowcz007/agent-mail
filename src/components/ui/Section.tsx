// Section = Title Strip + Content Area (LAYOUT §1.4)
// 2026-06-27 简化:去掉冗余的 "HEADER STRIP" 4 字,只保留 // {title}。
// 装饰符 // 跨语言一致(SPEC §3.8.1)。
import type { ReactNode } from "react";

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-outline bg-bg text-on-bg">
      <div className="bg-primary text-on-primary px-3 py-1.5 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono whitespace-pre">
          // {title}
        </h2>
        {right && (
          <div className="text-[10px] font-mono uppercase tracking-[0.1em]">
            {right}
          </div>
        )}
      </div>
      <div className="px-3 py-3">{children}</div>
    </section>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[20px] md:text-[24px] font-bold font-mono leading-tight tracking-[-0.02em] uppercase">
      {children}
    </h1>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono whitespace-pre">
      {children}
    </h2>
  );
}

export function Divider() {
  return <div className="border-t border-dashed border-outline my-4" />;
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-mono leading-relaxed text-on-bg">
      {children}
    </p>
  );
}

export function PromptLine({ children }: { children: ReactNode }) {
  return (
    <div className="text-[13px] font-mono leading-relaxed text-on-bg pl-4 before:content-['>'] before:mr-2 before:text-dim">
      {children}
    </div>
  );
}
