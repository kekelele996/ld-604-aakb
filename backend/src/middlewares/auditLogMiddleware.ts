import type { RequestHandler } from "express";

/**
 * 写请求审计中间件：业务审计日志由 service 写入快照（页面可见），
 * 这里额外输出一行服务端审计行，便于容器日志追溯。
 */
export const auditLogMiddleware: RequestHandler = (req, _res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const role = req.header("x-role") ?? "jwt";
    console.info(`[AUDIT] role=${role} ${req.method} ${req.originalUrl} body=${JSON.stringify(req.body ?? {})}`);
  }
  next();
};
