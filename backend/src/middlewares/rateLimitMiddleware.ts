import type { RequestHandler } from "express";

/**
 * 简易内存限流：默认每 IP 每分钟 120 次。
 * 写动作（POST）更严格：每 IP 每分钟 30 次，超出返回 RATE_LIMITED。
 */
const WINDOW_MS = 60_000;
const LIMIT_GET = 120;
const LIMIT_POST = 30;

const buckets = new Map<string, number[]>();

export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const limit = req.method === "POST" ? LIMIT_POST : LIMIT_GET;
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= limit) {
    res.setHeader("Retry-After", String(Math.ceil(WINDOW_MS / 1000)));
    return res.status(429).json({ code: "RATE_LIMITED", message: "请求过于频繁，请稍后再试" });
  }
  hits.push(now);
  buckets.set(ip, hits);
  next();
};
