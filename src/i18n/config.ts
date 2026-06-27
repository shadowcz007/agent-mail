// i18n 元数据 — locale 列表 / 默认 / cookie & storage key / 类型守卫
// 与 src/components/ThemeSwitcher.tsx 的 agent-mail.theme pattern 完全对称
export const LOCALES = ["zh-CN", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const COOKIE_NAME = "agent-mail.locale";
export const STORAGE_KEY = "agent-mail.locale";
export const COOKIE_MAX_AGE = 30 * 24 * 3600;

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

// UI 上 locale 切换按钮显示的标签
export const LOCALE_LABEL: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "EN",
};