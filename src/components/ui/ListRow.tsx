// 列表行 [ 01 ] item-name ....................... meta  [ > ]
import Link from "next/link";
import type { ReactNode } from "react";
import { padIndex } from "@/lib/format";

interface ListRowProps {
  index: number;
  title: ReactNode;
  meta?: ReactNode;
  href?: string;
  right?: ReactNode;
  subtitle?: ReactNode;
}

export function ListRow({
  index,
  title,
  meta,
  href,
  right,
  subtitle,
}: ListRowProps) {
  const inner = (
    <div className="flex flex-col gap-1 px-3 py-2 border-b border-outline-variant last:border-b-0 hover:bg-surface-container">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-mono text-dim w-8 shrink-0">
            [ {padIndex(index)} ]
          </span>
          <span className="text-[13px] font-mono text-on-bg truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {meta && (
            <span className="text-[10px] font-mono text-dim uppercase">
              {meta}
            </span>
          )}
          {right ?? (href && (
            <span className="text-[10px] font-bold font-mono text-on-bg">
              [ &gt; ]
            </span>
          ))}
        </div>
      </div>
      {subtitle && (
        <div className="text-[10px] font-mono text-dim pl-11">{subtitle}</div>
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
