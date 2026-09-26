import type { ErrorCode } from "./errorCodes";
import { ERROR_MESSAGES, renderMessage } from "./errorMessages";

/** 业务异常：service 抛出，页面/store 分别包装为提示，禁止全局吞掉 */
export class BusinessError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, params: Record<string, string | number> = {}) {
    super(renderMessage(ERROR_MESSAGES[code], params));
    this.code = code;
    this.name = "BusinessError";
  }
}
