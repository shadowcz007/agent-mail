"use client";
// i18n client-side — Provider + hook
// 对称 ThemeSwitcher:50-59 mount 时 localStorage 兜底
// setLocale 会: setAttribute('lang') + localStorage + document.cookie + router.refresh()
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  COOKIE_NAME,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  COOKIE_MAX_AGE,
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

interface I18nContext {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (ns: keyof Messages, key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nContext>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: () => "",
});

function setCookie(value: Locale) {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function clientTranslate(
  locale: Locale,
  ns: keyof Messages,
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = (ALL_MESSAGES[locale]?.[ns] ?? {}) as Record<string, string>;
  const fallback = (ALL_MESSAGES.en?.[ns] ?? {}) as Record<string, string>;
  let raw = dict[key];
  if (raw === undefined) {
    raw = fallback[key];
    if (raw === undefined) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing ${locale}.${String(ns)}.${key}`);
      }
      return `__${String(ns)}.${key}__`;
    }
  }
  if (!vars) return raw;
  return String(raw).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function I18nClientProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  const router = useRouter();

  useEffect(() => {
    // 客户端兜底:若 localStorage 与 server 初始值不一致,以 localStorage 为准
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored) && stored !== locale) {
      setLocaleState(stored);
      document.documentElement.setAttribute("lang", stored);
      setCookie(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    document.documentElement.setAttribute("lang", l);
    localStorage.setItem(STORAGE_KEY, l);
    setCookie(l);
    // !!! 必须 refresh,否则 server 组件仍用旧 locale 渲染
    router.refresh();
  }

  function t(ns: keyof Messages, key: string, vars?: Record<string, string | number>) {
    return clientTranslate(locale, ns, key, vars);
  }

  return (
    <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>
  );
}

export function useI18n() {
  return useContext(Ctx);
}

export function useT(ns: keyof Messages) {
  const { t } = useContext(Ctx);
  return (key: string, vars?: Record<string, string | number>) => t(ns, key, vars);
}