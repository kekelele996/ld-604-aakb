import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import type { Role } from "../types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number; name: string; role: Role };
    }
  }
}

const ROLE_USERS: Record<Role, { id: number; name: string }> = {
  DISPATCHER: { id: 1, name: "调度员-林调度" },
  LEADER: { id: 101, name: "张建国（班组长）" },
  WAREHOUSE: { id: 201, name: "仓管员-周敏" },
  AUDITOR: { id: 301, name: "审计员-郑审计" }
};

/**
 * JWT 认证：要求 Authorization: Bearer <token>。
 * 本地演示支持两种 token：
 *  1) /api/auth/login 签发的真实 JWT；
 *  2) 开发占位 token "dev:<ROLE>"，便于 curl/健康联调。
 */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  if (req.path === "/health" || req.path.startsWith("/api/auth")) return next();
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return next(Object.assign(new Error("AUTH_REQUIRED"), { status: 401, code: "AUTH_REQUIRED" }));

  try {
    if (token.startsWith("dev:")) {
      const role = token.slice(4) as Role;
      if (!(role in ROLE_USERS)) throw new Error("bad role");
      req.user = { ...ROLE_USERS[role], role };
      return next();
    }
    const payload = jwt.verify(token, config.jwtSecret) as unknown as { sub: number; name: string; role: Role };
    if (typeof payload === "string" || !("role" in payload)) throw new Error("bad token");
    req.user = { id: Number(payload.sub), name: payload.name, role: payload.role };
    return next();
  } catch {
    return next(Object.assign(new Error("AUTH_REQUIRED"), { status: 401, code: "AUTH_REQUIRED" }));
  }
};
