// TopBar — server component
// 显示品牌 + LocaleSwitcher + ThemeSwitcher + 登录/登出 + 邮箱
import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { getCurrentUser } from "@/lib/session";
import { getLocale, getTranslator } from "@/i18n/server";

interface TopBarProps {
  theme: string;
}

export async function TopBar({ theme }: TopBarProps) {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = getTranslator(locale, "topbar");

  return (
    <header className="border-b border-outline bg-bg">
      <div className="max-w-[1280px] mx-auto px-3 md:px-6 h-12 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary whitespace-nowrap"
        >
          {t("brand")}
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeSwitcher initialTheme={theme} />
          {user ? (
            <>
              <span className="hidden md:inline text-[10px] font-mono text-dim uppercase">
                {user.email}
              </span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="border border-outline bg-bg text-on-bg px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-primary hover:text-on-primary transition-colors"
                >
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="border border-outline bg-bg text-on-bg px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-primary hover:text-on-primary transition-colors"
              >
                {t("register")}
              </Link>
              <Link
                href="/login"
                className="border border-primary bg-primary text-on-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-accent hover:text-on-accent transition-colors"
              >
                {t("signIn")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}