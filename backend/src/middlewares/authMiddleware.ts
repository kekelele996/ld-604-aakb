import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../constants/Role";
import { BusinessError } from "../constants/errorMessages";
import { config } from "../config/env";
import type { AuthedRequest } from "../types/express";

/**
 * 认证中间件：
 * - 本地演示：前端通过 x-user-id/x-user-name/x-role 头传递当前角色；
 * - 正式部署：Authorization: Bearer <JWT>，密钥来自 config.jwtSecret。
 * 未认证（既无 JWT 也无角色头）→ AUTH_REQUIRED。
 */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  const request = req as AuthedRequest;
  try {
    const authHeader = req.header("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, config.jwtSecret) as { sub: string; role: Role; name: string };
      request.user = { id: Number(payload.sub), name: payload.name, role: payload.role };
      return next();
    }

    const roleHeader = req.header("x-role");
    if (roleHeader) {
      if (!Object.values(Role).includes(roleHeader as Role)) {
        throw new BusinessError("RBAC_DENIED", {}, 403);
      }
      request.user = {
        id: Number(req.header("x-user-id") ?? 0),
        name: decodeURIComponent(req.header("x-user-name") ?? "演示用户"),
        role: roleHeader as Role
      };
      return next();
    }

    throw new BusinessError("AUTH_REQUIRED", {}, 401);
  } catch (err) {
    if (err instanceof BusinessError) return next(err);
    return next(new BusinessError("AUTH_REQUIRED", {}, 401));
  }
};
