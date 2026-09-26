import type { RequestHandler } from "express";

/** 写操作审计埋点：业务 service 通过 appendAuditLog 落库，此中间件统一补充响应后日志确认 */
export const auditLogMiddleware: RequestHandler = (req, _res, next) => {
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    console.info(`[audit] write intent ${req.method} ${req.path} by ${req.user?.name ?? "anonymous"}`);
  }
  next();
};
