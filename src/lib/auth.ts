// 鉴权 wrapper - 5 层鉴权模型 (T0-T4) 集中实现
// SPEC §3.7.9: 严格按 Tier 规则,统一通过 withAuth(handler, { tier }) 包裹
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";
import { apiError } from "./errors";
import { SESSION_COOKIE, signSession, verifySession } from "./jwt";

export type AuthTier = "T0" | "T1" | "T2" | "T3" | "T4";

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
  /** 鉴权方式 - session / bearer */
  via: "session" | "bearer";
}

export interface AuthContext {
  user: AuthUser;
}

type RouteHandler<P = unknown> = (
  req: NextRequest,
  ctx: { params: P; auth: AuthContext }
) => Promise<Response> | Response;

type PublicHandler = (
  req: NextRequest,
  ctx: { params?: never; auth?: undefined }
) => Promise<Response> | Response;

// ─── 解析 session / bearer ──────────────────────────────
async function parseSession(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;

  const agent = await prisma.agent.findUnique({
    where: { email: payload.sub },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!agent) return null;
  return { id: agent.id, email: agent.email, isAdmin: agent.isAdmin, via: "session" };
}

async function parseBearer(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header);
  if (!m) return null;
  const apiKey = m[1];

  const agent = await prisma.agent.findUnique({
    where: { apiKey },
    select: { id: true, email: true, isAdmin: true, apiKey: true },
  });
  if (!agent?.apiKey) return null;

  // lastUsedAt 异步更新 - 不阻塞响应
  prisma.agent
    .update({ where: { id: agent.id }, data: { apiKeyLastUsedAt: new Date() } })
    .catch(() => {});

  return { id: agent.id, email: agent.email, isAdmin: agent.isAdmin, via: "bearer" };
}

/** 解析 session OR bearer(T1 专用) */
async function parseEither(req: NextRequest): Promise<AuthUser | null> {
  return (await parseSession()) ?? (await parseBearer(req));
}

// ─── Tier 路由包装器 ──────────────────────────────
/**
 * T0 = 公开
 * T1 = session OR bearer
 * T2 = bearer only (POST /api/events 专用)
 * T3 = session only
 * T4 = session + isAdmin
 */
export function withAuth<P = unknown>(
  tier: "T1" | "T2" | "T3" | "T4",
  handler: RouteHandler<P>
) {
  return async (req: NextRequest, routeCtx: { params: Promise<P> } | { params: P }) => {
    // Next.js 16: params 总是 Promise
    const params = "params" in routeCtx
      ? await (routeCtx.params as Promise<P>)
      : (undefined as unknown as P);

    let user: AuthUser | null = null;
    if (tier === "T1") {
      user = await parseEither(req);
      if (!user) return apiError("UNAUTHENTICATED");
    } else if (tier === "T2") {
      user = await parseBearer(req);
      if (!user) return apiError("INVALID_APIKEY");
    } else if (tier === "T3") {
      user = await parseSession();
      if (!user) return apiError("SESSION_INVALID");
    } else if (tier === "T4") {
      user = await parseSession();
      if (!user) return apiError("SESSION_INVALID");
      if (!user.isAdmin) return apiError("NOT_ADMIN");
    }

    return handler(req, { params, auth: { user: user! } });
  };
}

/** T0 公开端点 - 不做任何鉴权 */
export function withPublic(
  handler: PublicHandler
) {
  return async (req: NextRequest, routeCtx?: { params: Promise<unknown> }) => {
    const params = routeCtx ? await routeCtx.params : undefined;
    return handler(req as NextRequest, { params: params as never });
  };
}

/** 登入态设置 Session Cookie (用于 /api/auth/login 响应) */
export async function setSessionCookie(email: string): Promise<NextResponse> {
  const token = await signSession(email);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return NextResponse.json({ ok: true });
}

/** 清除 Session Cookie (用于 /api/auth/logout) */
export async function clearSessionCookie(): Promise<NextResponse> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return new NextResponse(null, { status: 204 });
}

export { parseSession, parseBearer };
