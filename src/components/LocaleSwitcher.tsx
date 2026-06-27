"use client";
// Locale 切换器 — 与 ThemeSwitcher 对称实现
// 切换会同步: <html lang> + localStorage + cookie + router.refresh()
import { useI18n } from "@/i18n/client";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l: Locale) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            aria-label={`Language: ${LOCALE_LABEL[l]}`}
            className={
              active
                ? "border border-primary bg-primary text-on-primary px-2 py-1 hover:bg-accent hover:text-on-accent"
                : "border border-outline bg-bg text-on-bg px-2 py-1 hover:bg-primary hover:text-on-primary"
            }
          >
            [{active ? "●" : "○"}] {LOCALE_LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}