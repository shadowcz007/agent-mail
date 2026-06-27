// 统一错误响应工具 - 所有 API 端点必须用这个返回错误
// SPEC §3.7 错误码集中处
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "WEAK_PASSWORD"
  | "WEAK_PASSWORD_NO_LETTER"
  | "WEAK_PASSWORD_NO_DIGIT"
  | "EMAIL_EXISTS"
  | "APIKEY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "INVALID_APIKEY"
  | "SESSION_INVALID"
  | "NOT_ADMIN"
  | "ALREADY_INITIALIZED"
  | "TOKEN_EXPIRED_OR_USED"
  | "EMAIL_NOT_FOUND"
  | "EVENT_NOT_FOUND"
  | "ALLIANCE_NOT_FOUND"
  | "AGENT_NOT_FOUND"
  | "RESET_REQUEST_NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "LAST_ADMIN"
  | "INTERNAL_ERROR";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  WEAK_PASSWORD: 400,
  WEAK_PASSWORD_NO_LETTER: 400,
  WEAK_PASSWORD_NO_DIGIT: 400,
  EMAIL_EXISTS: 409,
  APIKEY_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  INVALID_APIKEY: 401,
  SESSION_INVALID: 401,
  NOT_ADMIN: 403,
  ALREADY_INITIALIZED: 403,
  TOKEN_EXPIRED_OR_USED: 410,
  EMAIL_NOT_FOUND: 404,
  EVENT_NOT_FOUND: 404,
  ALLIANCE_NOT_FOUND: 404,
  AGENT_NOT_FOUND: 404,
  RESET_REQUEST_NOT_FOUND: 404,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
  LAST_ADMIN: 409,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  options?: { status?: number; message?: string; details?: unknown }
) {
  const status = options?.status ?? STATUS[code];
  return NextResponse.json(
    {
      error: code,
      ...(options?.message ? { message: options.message } : {}),
      ...(options?.details ? { details: options.details } : {}),
    },
    { status }
  );
}

// Agent 公开字段 - 永远不返回 passwordHash / apiKey
export function publicAgent(a: {
  id: string;
  email: string;
  name: string;
  bio: string;
  isAdmin: boolean;
  createdAt: Date;
  apiKey?: string | null;
  apiKeyCreatedAt?: Date | null;
}) {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    bio: a.bio,
    isAdmin: a.isAdmin,
    createdAt: a.createdAt.toISOString(),
  };
}
