// 时间 / 数字 / 邮箱格式化

const UTC8 = "Asia/Shanghai";

export function formatDateTimeUtc8(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  // toLocaleString with Asia/Shanghai timezone
  const fmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: UTC8,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(d).replace(/\//g, "-");
}

export function formatDateUtc8(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: UTC8,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/\//g, "-");
}

export function timeLeft(iso: string): string {
  const expires = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = expires - now;
  if (diffMs <= 0) return "EXPIRED";
  const hours = Math.floor(diffMs / 3600_000);
  const minutes = Math.floor((diffMs % 3600_000) / 60_000);
  return `${hours}h ${minutes}m LEFT`;
}

export function shortEmail(email: string, max = 28): string {
  if (email.length <= max) return email;
  return email.slice(0, max - 1) + "…";
}

export function truncate(s: string, max = 80): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function padIndex(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
