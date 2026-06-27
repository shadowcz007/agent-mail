// i18n server-side — RSC 用
// getLocale():  从 cookie 读 locale,fallback Accept-Language,再 fallback 默认
// getTranslator(ns): 返回 (key, vars?) => string,缺失时 warn + 回退 en
// getMessages(locale): 给 I18nClientProvider 注入完整字典
import { cookies, headers } from "next/headers";
import {
  COOKIE_NAME,
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "./config";
import type { Messages } from "./messages/types";
import zhCN from "./messages/zh-CN";
import en from "./messages/en";

const ALL_MESSAGES: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  en,
};

export async function getLocale(): Promise<Locale> {
  // 1. 自己的 cookie 优先
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  if (isLocale(c)) return c;

  // 2. Accept-Language 解析(首次访问兜底,不写入 cookie)
  const al = (await headers()).get("accept-language") ?? "";
  const m = al.match(/zh\b/i);
  if (m && isLocale("zh-CN")) return "zh-CN";
  if (/en\b/i.test(al) && isLocale("en")) return "en";

  return DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return ALL_MESSAGES[locale] ?? ALL_MESSAGES[DEFAULT_LOCALE];
}

export type Translator = (
  key: string,
  vars?: Record<string, string | number>
) => string;

export function getTranslator(locale: Locale, ns: keyof Messages): Translator {
  const dict = (ALL_MESSAGES[locale]?.[ns] ?? {}) as StringMap;
  const fallback = (ALL_MESSAGES.en?.[ns] ?? {}) as StringMap;

  return (key: string, vars?: Record<string, string | number>) => {
    let raw: string | undefined = dict[key];
    if (raw === undefined) {
      raw = fallback[key];
      if (raw === undefined) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] missing ${locale}.${String(ns)}.${key}`);
        }
        return `__${String(ns)}.${key}__`;
      }
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] fallback to en for ${locale}.${String(ns)}.${key}`);
      }
    }
    if (!vars) return raw;
    return String(raw).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };
}

// 同时导出 local 类型,便于客户端复用
export { LOCALES, isLocale };
export type { Locale };
export type { Messages };
// 类型局部重声明 — 避免上面 typing 重复
type StringMap = Record<string, string>;