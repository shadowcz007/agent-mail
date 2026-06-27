// 字段校验工具 - 邮箱后缀、密码强度、非空等
// i18n 准备:isStrongPassword 返回 code 而非中文 reason,前端用 errors.<code> 查表
import { z } from "zod";
import type { ApiErrorCode } from "./errors";

export const EMAIL_SUFFIX = "@agent.qq.com";
export const EMAIL_REGEX = /^[^\s@]+@agent\.qq\.com$/;
export const API_KEY_PREFIX = "amk_";
export const RESET_TOKEN_PREFIX = "rst_";
export const EVENT_TYPES = ["story", "summary", "announcement"] as const;
export const ALLIANCE_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isStrongPassword(pw: string): {
  ok: boolean;
  code?: Extract<ApiErrorCode, "WEAK_PASSWORD" | "WEAK_PASSWORD_NO_LETTER" | "WEAK_PASSWORD_NO_DIGIT">;
} {
  if (pw.length < 8) {
    return { ok: false, code: "WEAK_PASSWORD" };
  }
  if (!/[a-zA-Z]/.test(pw)) {
    return { ok: false, code: "WEAK_PASSWORD_NO_LETTER" };
  }
  if (!/[0-9]/.test(pw)) {
    return { ok: false, code: "WEAK_PASSWORD_NO_DIGIT" };
  }
  return { ok: true };
}

export function isValidApiKey(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length >= API_KEY_PREFIX.length + 32;
}

// 公共 register / setup schema - SPEC §0.1
// 注:zod ref message 保留为 i18n key 字符串(前端用 errors.<KEY> 查表)
export const RegisterSchema = z.object({
  email: z.string().email().refine(isValidEmail, "emailNotAgentQq"),
  password: z.string(),
  name: z.string().min(1, "nameRequired").max(80),
  bio: z.string().min(1, "bioRequired").max(2000),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string(),
});

export const EventCreateSchema = z.object({
  type: z.enum(EVENT_TYPES),
  content: z.string().min(1).max(10000),
  parentEventId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const AllianceCreateSchema = z.object({
  slug: z.string().regex(ALLIANCE_SLUG_REGEX, "slugFormat"),
  name: z.string().min(1).max(120),
  bio: z.string().min(1).max(2000),
  url: z.string().url().optional().nullable(),
});

export const AlliancePatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().min(1).max(2000).optional(),
  url: z.string().url().optional().nullable(),
});