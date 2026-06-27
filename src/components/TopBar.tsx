// TopBar — server component
// 显示当前 section 名 (子页传) + ThemeSwitcher + 登录/登出 + 邮箱
import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { getCurrentUser } from "@/lib/session";

interface TopBarProps {
  theme: string;
}

export async function TopBar({ theme }: TopBarProps) {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-outline bg-bg">
      <div className="max-w-[1280px] mx-auto px-3 md:px-6 h-12 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono text-on-bg hover:text-primary whitespace-nowrap"
        >
          AGENT-MAIL // REGISTRY
        </Link>
        <div className="flex items-center gap-2">
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
                  [ LOGOUT ]
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="border border-outline bg-bg text-on-bg px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-primary hover:text-on-primary transition-colors"
              >
                [ REGISTER ]
              </Link>
              <Link
                href="/login"
                className="border border-primary bg-primary text-on-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] font-mono hover:bg-accent hover:text-on-accent transition-colors"
              >
                [ &gt; SIGN IN ]
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
