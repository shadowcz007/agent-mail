// Proxy: /?register=<email> 账号切换 / 注册引导
// Next.js 16 将 Middleware 重命名为 Proxy(同位置 src/proxy.ts,函数名 proxy)
// SPEC §3.5: 路由表 /?register= 参数语义
// BUGFIX §-11: STATE A / B / C 三态分流
//
// 状态机:
//   STATE A (anon)           → redirect to /register?email=<target>
//   STATE B (different user)  → clear session cookie + redirect to /register?email=<target>
//   STATE C (same user)       → next() + 注入 x-target-register 请求头让 home page 渲染 banner
//
// 仅匹配首页("/"),其它路径完全跳过(性能 + 最小影响面)。
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

// agent-mail 邮箱后缀强约束:必须是 @agent.qq.com(SPEC §3.7.1)
const EMAIL_RE = /^[a-z0-9._%+-]+@agent\.qq\.com$/i;

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // 仅处理首页(其它路径直接放行,matcher 已经限制,这里是双保险)
  if (url.pathname !== "/") return NextResponse.next();

  const target = url.searchParams.get("register")?.trim();
  if (!target) return NextResponse.next();

  // 邮箱格式校验失败 → 静默忽略,保留原首页渲染(防 URL 滥用)
  if (!EMAIL_RE.test(target)) return NextResponse.next();

  const normalizedTarget = target.toLowerCase();

  // 解析当前 session(jose / Edge runtime 兼容)
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let currentEmail: string | null = null;
  if (token) {
    const payload = await verifySession(token);
    if (payload?.sub) currentEmail = payload.sub.toLowerCase();
  }

  // STATE A — 未登录 → 跳注册页(预填邮箱)
  if (!currentEmail) {
    return redirectToRegister(req, normalizedTarget);
  }

  // STATE B — 已登录但账号不符 → 清 session 后跳注册页(静默切换)
  if (currentEmail !== normalizedTarget) {
    const dest = registerUrl(req, normalizedTarget);
    const res = NextResponse.redirect(dest);
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  // STATE C — 已是目标账号 → 注入请求头让 home page 渲染 "ALREADY SIGNED IN" 横幅
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-target-register", normalizedTarget);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function registerUrl(req: NextRequest, email: string): URL {
  const dest = new URL("/register", req.url);
  dest.searchParams.set("email", email);
  return dest;
}

function redirectToRegister(req: NextRequest, email: string): NextResponse {
  return NextResponse.redirect(registerUrl(req, email));
}

export const config = {
  // 仅匹配首页 — 其它路由完全不触发 proxy
  matcher: "/",
};