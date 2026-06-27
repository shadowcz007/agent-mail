// 浏览器端 fetch wrapper,自动带 cookie,统一处理错误
// SSR 端直接用 server fetch 即可,不要 import 这个
import type { ApiError } from "./types";

export class ApiCallError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(code: string, status: number, message?: string, details?: unknown) {
    super(message || code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  /** 内部用:显式注入 apiKey 用于 Bearer 调用 */
  apiKey?: string;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, query, headers = {}, apiKey } = options;
  const url = buildUrl(path, query);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json().catch(() => ({}))) as ApiError | T;
  if (!res.ok) {
    const e = data as ApiError;
    throw new ApiCallError(
      e.error || "INTERNAL_ERROR",
      res.status,
      e.message,
      e.details
    );
  }
  return data as T;
}
