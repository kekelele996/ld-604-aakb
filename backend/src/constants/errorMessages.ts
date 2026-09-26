import { ERROR_CODES } from "./errorCodes";

export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  AUTH_REQUIRED: "缺少有效的 Bearer Token",
  RBAC_DENIED: "当前角色无权执行该操作",
  VALIDATION_FAILED: "请求参数缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  ASSET_NOT_FOUND: "资产台账中不存在编号为 {id} 的配网资产",
  FAULT_NOT_FOUND: "找不到故障报修单 {id}",
  FAULT_ALREADY_TICKETED: "报修单 {no} 已生成工单，不能重复生成",
  FAULT_MERGE_SELF: "报修单不能与自身合并",
  FAULT_MERGE_TARGET_MERGED: "目标报修单 {no} 已是重复单，不能作为主单",
  FAULT_MERGE_DIFFERENT_LINE: "仅同一馈线（{line}）的重复报修允许合并",
  TICKET_NOT_FOUND: "找不到抢修工单 {id}",
  TICKET_STATUS_ILLEGAL: "工单 {no} 当前状态不允许执行该操作",
  CREW_NOT_DISPATCHABLE: "班组 {name} 当前非值班状态，无法派工",
  CREW_SKILL_MISMATCH: "班组 {name} 缺少该故障所需技能：{skill}",
  PART_NOT_FOUND: "备件台账中不存在该物料",
  PART_STOCK_INSUFFICIENT: "备件 {name} 库存不足（当前 {stock}，申请 {quantity}）",
  PART_REQ_NOT_PENDING: "备件申请 {no} 不是待审批状态",
  PART_REQ_NOT_APPROVED: "备件申请 {no} 未审批通过，不能归还"
};

export function renderMessage(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}
