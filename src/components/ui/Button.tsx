// 通用按钮 — 三种 variant: primary (黑底白字), secondary (米底黑边), danger (琥珀底)
// 全直角 / 全大写 / 等宽字体
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] font-mono border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary border-primary hover:bg-accent hover:text-on-accent",
  secondary:
    "bg-bg text-on-bg border-outline hover:bg-primary hover:text-on-primary",
  danger:
    "bg-warning text-on-warning border-warning hover:bg-error hover:text-on-error",
  ghost:
    "bg-transparent text-on-bg border-transparent hover:border-outline",
};

export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? "[ ... ]" : children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  children,
  className = "",
  ...rest
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
