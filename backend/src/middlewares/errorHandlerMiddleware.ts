import type { ErrorRequestHandler } from "express";
import { BusinessError } from "../constants/errorMessages";

/**
 * 全局异常处理：controller/service 分层抛出的 BusinessError 统一收口，
 * 但业务层已各自包装消息，这里只负责响应格式，绝不吞掉错误码。
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof BusinessError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  if (err instanceof SyntaxError) {
    return res.status(400).json({ code: "VALIDATION_FAILED", message: "请求体不是合法 JSON" });
  }
  console.error("[unhandled]", err);
  return res.status(500).json({ code: "INTERNAL_ERROR", message: "服务内部错误" });
};
