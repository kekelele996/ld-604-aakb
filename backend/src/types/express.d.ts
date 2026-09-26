import type { Request } from "express";
import type { CurrentUser } from "../models/Audit";

/** 扩展 Express Request：authMiddleware 解析身份后挂载 */
export interface AuthedRequest extends Request {
  user?: CurrentUser;
}
