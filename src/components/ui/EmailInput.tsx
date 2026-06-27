"use client";
// 邮箱输入框 — 视觉语言:`[> [ alice ] @agent.qq.com`
// 复用于所有需要 @agent.qq.com 邮箱的地方(登录/注册/忘记密码/admin 登录/admin bootstrap/TRANSFER ADMIN)。
// 字段名固定为 emailLocal(只输入本地部分,提交时拼上 EMAIL_SUFFIX),
// 这是 agent-mail 的设计约定 —— 防止用户误填其他域名。
import { useState } from "react";
import { Field } from "./Input";
import { EMAIL_SUFFIX } from "@/lib/validate";

interface Props {
  /** form field name,默认 "emailLocal" */
  name?: string;
  /** 受控值(可选,缺省走内部 state) */
  value?: string;
  /** 受控 onChange(可选) */
  onChange?: (v: string) => void;
  /** placeholder,默认 "alice" */
  placeholder?: string;
  /** autoComplete,默认 "username" */
  autoComplete?: string;
  /** 字段标签,默认 "EMAIL" */
  label?: string;
  /** 附加在"完整地址:"前的提示文本(例如 RegisterForm 解释去 agent.qq.com 注册) */
  prefixHint?: string;
  /** 是否必填,默认 true */
  required?: boolean;
  /** 自定义 hint 文案(完全覆盖自动生成的"完整地址"提示) */
  hint?: string;
}

export function EmailInput({
  name = "emailLocal",
  value: controlled,
  onChange,
  placeholder = "alice",
  autoComplete = "username",
  label = "EMAIL",
  prefixHint,
  required = true,
  hint: customHint,
}: Props) {
  // 非受控 fallback
  const [internal, setInternal] = useState("");
  const isControlled = controlled !== undefined;
  const value = isControlled ? (controlled as string) : internal;

  const fullAddress = value
    ? `${value}${EMAIL_SUFFIX}`
    : EMAIL_SUFFIX;

  const hint = customHint ?? (prefixHint ? `${prefixHint}完整地址:${fullAddress}` : `完整地址:${fullAddress}`);

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-0 border-b border-outline-variant focus-within:border-primary">
        <span className="text-[13px] font-mono text-dim pl-2 before:content-['>'] before:mr-2">
          [
        </span>
        <input
          name={name}
          required={required}
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            if (!isControlled) setInternal(e.target.value);
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent border-0 px-1 py-1.5 text-[13px] font-mono text-on-bg focus:outline-none placeholder:text-dim"
        />
        <span className="text-[13px] font-mono text-dim pr-2">]</span>
        <span className="text-[13px] font-mono text-on-bg pr-2">
          {EMAIL_SUFFIX}
        </span>
      </div>
    </Field>
  );
}