import { NextResponse } from "next/server";

// Best-effort per-instance limiter. Use Redis/Upstash for multi-instance production deployments.
const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
export function safeUrl(value: string, hosts: string[]) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}
export function tooManyRequests() {
  return NextResponse.json({ success: false, error: "Too many requests. Please wait and try again." }, { status: 429 });
}
