// Reset Token 生成 - rst_ 前缀 + 256-bit base64url (SPEC §3.7.7)
import { randomBytes } from "crypto";
import { RESET_TOKEN_PREFIX } from "./validate";

export function generateResetToken(): string {
  const random = randomBytes(32).toString("base64url");
  return RESET_TOKEN_PREFIX + random;
}
