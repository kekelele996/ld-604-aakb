import { ERROR_CODES } from "./errorCodes";

/** 错误消息模板（与前端 constants/errorMessages 镜像），{xxx} 由 BusinessError 填充 */
export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误：{field}",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  NOT_FOUND: "未找到 {entity}（编号 {id}）",
  INVALID_TRANSITION: "工单 {id} 当前状态 {from} 不允许变更为 {to}",
  DUPLICATE_MERGE: "报修 {id} 已被合并，不能重复合并",
  NO_AVAILABLE_CREW: "没有同时满足技能 {skill} 且值班待命的班组",
  PART_PENDING_APPROVAL: "备件申请 {id} 尚在审批中，审批通过后才会扣减库存",
  PART_INSUFFICIENT_STOCK: "备件 {partCode} 库存不足：当前 {stock}，申请 {quantity}",
  PART_ALREADY_DECIDED: "备件申请 {id} 已审批，不能重复审批",
  ASSET_NOT_FOUND: "报修必须关联有效配网资产，未找到资产 {id}",
  TICKET_NOT_ACTIVE: "工单 {id} 已复电或归档，不能再推进状态",
  UNKNOWN_ACTION: "未知业务动作 {name}"
};

export class BusinessError extends Error {
  code: keyof typeof ERROR_CODES;
  status: number;
  constructor(
    code: keyof typeof ERROR_CODES,
    params: Record<string, string | number> = {},
    status = 400
  ) {
    super(ERROR_MESSAGES[code].replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`)));
    this.code = code;
    this.status = status;
    this.name = "BusinessError";
  }
}
