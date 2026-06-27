"use client";

// Theme switcher dropdown — 全站始终可见,localStorage 持久化 + cookie 同步
import { useEffect, useRef, useState } from "react";
import type { ThemeId } from "@/lib/types";

const THEMES: Array<{
  id: ThemeId;
  name: string;
  desc: string;
  bg: string;
  fg: string;
}> = [
  {
    id: "protocol-registry",
    name: "PROTOCOL REGISTRY",
    desc: "米黄 + 黑字 + 终端绿",
    bg: "#fcf9f3",
    fg: "#1c1c18",
  },
  {
    id: "terminal",
    name: "TERMINAL",
    desc: "全黑 + 终端绿字",
    bg: "#1c1c18",
    fg: "#fcf9f3",
  },
  {
    id: "studio",
    name: "STUDIO",
    desc: "纯白 + 黑字 + 中性灰",
    bg: "#ffffff",
    fg: "#0d0d0d",
  },
];

const COOKIE_NAME = "agent-mail.theme";
const STORAGE_KEY = "agent-mail.theme";
const COOKIE_MAX_AGE = 30 * 24 * 3600;

function setCookie(value: string) {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function ThemeSwitcher({ initialTheme }: { initialTheme: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(initialTheme);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 客户端兜底:若 localStorage 与 cookie/html 不一致,以 localStorage 为准
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== current) {
      setCurrent(stored);
      document.documentElement.setAttribute("data-theme", stored);
      setCookie(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  function selectTheme(id: ThemeId) {
    setCurrent(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem(STORAGE_KEY, id);
    setCookie(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-outline bg-bg text-on-bg px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-primary hover:text-on-primary transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        [ THEME {open ? "▴" : "▾"} ]
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 z-50 w-[280px] border border-outline bg-bg text-on-bg shadow-none"
        >
          <div className="px-3 py-2 border-b border-outline-variant text-[10px] font-bold uppercase tracking-[0.1em] text-dim">
            THEME // SELECT
          </div>
          {THEMES.map((t) => {
            const active = current === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => selectTheme(t.id)}
                className={`w-full text-left px-3 py-2 border-b border-outline-variant last:border-b-0 hover:bg-surface-container ${
                  active ? "bg-surface-container" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono">
                    [ {active ? "●" : "○"} ] {t.name}
                  </span>
                  <span
                    className="inline-block w-4 h-4 border border-outline"
                    style={{ background: t.bg }}
                    aria-hidden
                  />
                </div>
                <div className="text-[10px] text-dim mt-0.5 font-mono">
                  BG {t.bg.toUpperCase()} / FG {t.fg.toUpperCase()}
                </div>
                <div className="text-[10px] text-dim mt-0.5 font-mono">
                  ▢ {t.desc}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
