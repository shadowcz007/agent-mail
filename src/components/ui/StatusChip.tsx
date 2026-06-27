// 状态标签 ( ACTIVE ) / ( VERIFIED ) / ( OFFLINE ) / ( WARNING )
import type { ReactNode } from "react";

type Tone = "default" | "accent" | "warning" | "error" | "muted";

const tones: Record<Tone, string> = {
  default: "text-on-bg",
  accent: "text-accent",
  warning: "text-warning",
  error: "text-error",
  muted: "text-dim",
};

export function StatusChip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-[0.1em] font-mono whitespace-nowrap ${tones[tone]}`}
    >
      ( {children} )
    </span>
  );
}
