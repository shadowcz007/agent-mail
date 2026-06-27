// Session JWT 签发 / 校验
// 使用 jose (Web Crypto API,Edge 兼容,无 native dep)
// SPEC §3.1.1: Session 存于 HTTP-only Cookie,有效 7 天
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "agent-mail.session";
const SESSION_TTL_SEC = 7 * 24 * 3600;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // 开发期兜底,生产必须在 .env 设置
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production (>=32 chars)");
    }
    return new TextEncoder().encode("dev-only-secret-change-me-in-production-please");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // agent email
  iat: number;
  exp: number;
}

export async function signSession(email: string): Promise<string> {
  return new SignJWT({ sub: email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_TTL_SEC };
