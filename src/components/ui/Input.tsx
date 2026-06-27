// 通用 Input + Textarea + Label — 底部 1px 边,聚焦时全边框
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg">
        {label}
      </label>
      {children}
      {hint && (
        <div className="text-[10px] font-mono text-dim pl-4 before:content-['>_'] before:mr-1 before:text-dim">
          {hint}
        </div>
      )}
    </div>
  );
}

const inputBase =
  "w-full bg-bg text-on-bg border-0 border-b border-outline-variant px-2 py-1.5 text-[13px] font-mono focus:border-primary focus:outline-none focus:ring-0 placeholder:text-dim";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputBase} ${className}`} />;
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${inputBase} resize-y min-h-[80px] ${className}`}
    />
  );
}
