import type { RequestHandler } from "express";

/** 入站请求日志：方法 / 路径 / 角色 / 耗时 */
export const requestLoggerMiddleware: RequestHandler = (req, _res, next) => {
  const start = Date.now();
  _res.on("finish", () => {
    const role = req.header("x-role") ?? (req.header("authorization") ? "jwt" : "anon");
    console.info(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} role=${role} status=${_res.statusCode} ${Date.now() - start}ms`
    );
  });
  next();
};
