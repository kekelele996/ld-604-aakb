import type { ErrorRequestHandler } from "express";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/**
 * 全局异常处理：统一错误响应外壳 { code, message }。
 * 业务异常消息已在 service/controller 层包装；这里只兜底，不吞掉堆栈日志。
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as { status?: number }).status ?? 500;
  const code = (err as { code?: string }).code ?? "INTERNAL_ERROR";
  if (status >= 500) console.error("[error]", err);
  const message = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] && !(err as { message?: string }).message
    ? ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]
    : (err as Error).message ?? "内部错误";
  res.status(status).json({ code, message });
};
