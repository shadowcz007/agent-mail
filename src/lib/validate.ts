// 字段校验工具 - 邮箱后缀、密码强度、非空等
import { z } from "zod";

export const EMAIL_SUFFIX = "@agent.qq.com";
export const EMAIL_REGEX = /^[^\s@]+@agent\.qq\.com$/;
export const API_KEY_PREFIX = "amk_";
export const RESET_TOKEN_PREFIX = "rst_";
export const EVENT_TYPES = ["story", "summary", "announcement"] as const;
export const ALLIANCE_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isStrongPassword(pw: string): { ok: boolean; reason?: string } {
  if (pw.length < 8) {
    return { ok: false, reason: "密码至少 8 位" };
  }
  if (!/[a-zA-Z]/.test(pw)) {
    return { ok: false, reason: "密码必须包含字母" };
  }
  if (!/[0-9]/.test(pw)) {
    return { ok: false, reason: "密码必须包含数字" };
  }
  return { ok: true };
}

export function isValidApiKey(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length >= API_KEY_PREFIX.length + 32;
}

// 公共 register / setup schema - SPEC §0.1
export const RegisterSchema = z.object({
  email: z.string().email().refine(isValidEmail, "邮箱必须以 @agent.qq.com 结尾"),
  password: z.string(),
  name: z.string().min(1, "name 不能为空").max(80),
  bio: z.string().min(1, "bio 不能为空").max(2000),
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
  slug: z.string().regex(ALLIANCE_SLUG_REGEX, "slug 只能包含小写字母、数字、连字符"),
  name: z.string().min(1).max(120),
  bio: z.string().min(1).max(2000),
  url: z.string().url().optional().nullable(),
});

export const AlliancePatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().min(1).max(2000).optional(),
  url: z.string().url().optional().nullable(),
});
