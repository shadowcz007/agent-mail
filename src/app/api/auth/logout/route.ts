// POST /api/auth/logout - T3 Session,清除 Session Cookie
// SPEC §3.1.1 / API §3.2
// 返回 303 重定向到 /,而非 204。这样 TopBar (server component) 才能在登出后
// 重新执行 getCurrentUser() 渲染匿名态。204 No Content 浏览器不会导航,
// 页面不刷新,右上角仍显示旧邮箱 + LOGOUT。
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, withAuth } from "@/lib/auth";

export const POST = withAuth("T3", async (req: NextRequest) => {
  const cleared = await clearSessionCookie();
  // 复用已设置的 Set-Cookie 头(让 cookie 失效),改成 303 跳转
  const url = new URL("/", req.url);
  return NextResponse.redirect(url, {
    status: 303,
    headers: cleared.headers,
  });
});