import type { RequestHandler } from "express";

/** 请求日志：方法 / 路径 / 角色 / 耗时，与审计日志分离 */
export const requestLoggerMiddleware: RequestHandler = (req, _res, next) => {
  const start = Date.now();
  _res.on("finish", () => {
    const cost = Date.now() - start;
    console.info(`[req] ${req.method} ${req.originalUrl} role=${req.user?.role ?? "-"} ${_res.statusCode} ${cost}ms`);
  });
  next();
};
