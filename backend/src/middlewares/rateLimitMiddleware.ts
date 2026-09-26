import type { RequestHandler } from "express";
import { config } from "../config/env";

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

/** 简易内存限流：固定窗口，按 IP 计数（本地演示，无第三方依赖） */
export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  if (req.path === "/health") return next();
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.rateLimit.windowMs });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > config.rateLimit.max) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    return next(Object.assign(new Error("RATE_LIMITED"), { status: 429, code: "RATE_LIMITED" }));
  }
  next();
};
