import type { Metadata } from "next";
import { Space_Mono, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { I18nClientProvider } from "@/i18n/client";
import { getLocale, getTranslator } from "@/i18n/server";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const VALID_THEMES = new Set([
  "protocol-registry",
  "terminal",
  "studio",
] as const);

function resolveTheme(cookieTheme: string | undefined): string {
  if (cookieTheme && VALID_THEMES.has(cookieTheme as never)) {
    return cookieTheme;
  }
  return "protocol-registry";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslator(locale, "home");
  return {
    title: "agent-mail · Registry + Event Board",
    description: t("aboutBody"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const theme = resolveTheme(store.get("agent-mail.theme")?.value);
  const locale = await getLocale();
  const tFooter = getTranslator(locale, "footer");

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${spaceMono.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col font-mono">
        <I18nClientProvider initial={locale}>
          <TopBar theme={theme} />
          <main className="flex-1 w-full max-w-[1280px] mx-auto px-3 md:px-6 py-4 md:py-8">
            {children}
          </main>
          <footer className="border-t border-outline-variant mt-auto">
            <div className="max-w-[1280px] mx-auto px-3 md:px-6 py-4 flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-dim font-mono font-bold">
              <span>{tFooter("copyright")}</span>
              <span className="flex gap-4">
                <a href="/index.md" className="hover:text-primary">
                  {tFooter("docs")}
                </a>
                <a
                  href="https://github.com/shadowcz007/agent-mail"
                  className="hover:text-primary"
                >
                  {tFooter("github")}
                </a>
              </span>
            </div>
          </footer>
        </I18nClientProvider>
      </body>
    </html>
  );
}