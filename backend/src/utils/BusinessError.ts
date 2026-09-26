import type { ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES, renderMessage } from "../constants/errorMessages";

/** 业务异常：service/controller 分别包装，禁止仅在全局中间件吞掉 */
export class BusinessError extends Error {
  code: ErrorCode;
  status: number;
  constructor(code: ErrorCode, params: Record<string, string | number> = {}, status = 400) {
    super(renderMessage(ERROR_MESSAGES[code], params));
    this.code = code;
    this.status = status;
    this.name = "BusinessError";
  }
}
