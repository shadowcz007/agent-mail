// API Key 生成 - amk_ 前缀 + 256-bit base64url (SPEC §3.7.4 不哈希)
import { randomBytes } from "crypto";
import { API_KEY_PREFIX } from "./validate";

export function generateApiKey(): string {
  // 32 字节 = 256 bits, base64url 编码约 43 字符
  const random = randomBytes(32).toString("base64url");
  return API_KEY_PREFIX + random;
}
