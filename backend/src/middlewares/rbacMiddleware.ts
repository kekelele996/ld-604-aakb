import type { RequestHandler } from "express";
import type { Role } from "../types";

const PERMISSIONS: Record<Role, string[]> = {
  DISPATCHER: ["fault:register", "fault:merge", "ticket:create", "ticket:dispatch", "crew:toggleDuty"],
  LEADER: ["ticket:advance", "ticket:restore", "part:apply", "part:return", "asset:update"],
  WAREHOUSE: ["part:approve", "part:reject", "stock:adjust"],
  AUDITOR: ["audit:view"]
};

/** RBAC：路由级角色校验 + 动作权限校验，service 层也会二次校验 */
export const rbacMiddleware = (actions: string[]): RequestHandler => (req, _res, next) => {
  const role = req.user?.role;
  if (!role) return next(Object.assign(new Error("AUTH_REQUIRED"), { status: 401, code: "AUTH_REQUIRED" }));
  const allowed = actions.every((action) => PERMISSIONS[role]?.includes(action));
  if (!allowed) return next(Object.assign(new Error("RBAC_DENIED"), { status: 403, code: "RBAC_DENIED" }));
  next();
};

export const hasPermission = (role: Role | undefined, action: string): boolean =>
  !!role && (PERMISSIONS[role]?.includes(action) ?? false);
