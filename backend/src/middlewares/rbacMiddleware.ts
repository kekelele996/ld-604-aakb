import type { RequestHandler } from "express";
import { Role, ACTION_ROLES } from "../constants/Role";
import { BusinessError } from "../constants/errorMessages";
import type { AuthedRequest } from "../types/express";

/**
 * RBAC 中间件：
 * - rbacRequired(Role.DISPATCHER)：按角色拦截整条路由；
 * - rbacAction("dispatchTicket")：按动作名查 ACTION_ROLES 校验。
 * 审计员只读：写动作均未授予 AUDITOR。
 */
export const rbacRequired =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    const user = (req as AuthedRequest).user;
    if (!user) return next(new BusinessError("AUTH_REQUIRED", {}, 401));
    if (!roles.includes(user.role)) return next(new BusinessError("RBAC_DENIED", {}, 403));
    next();
  };

export const rbacAction =
  (action: string): RequestHandler =>
  (req, _res, next) => {
    const user = (req as AuthedRequest).user;
    if (!user) return next(new BusinessError("AUTH_REQUIRED", {}, 401));
    const allowed = ACTION_ROLES[action];
    if (!allowed || !allowed.includes(user.role)) {
      return next(new BusinessError("RBAC_DENIED", {}, 403));
    }
    next();
  };

/** 兼容旧名 */
export const rbacMiddleware = rbacRequired;
