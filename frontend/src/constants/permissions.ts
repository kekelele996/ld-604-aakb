import { Role } from "./Role";

/**
 * RBAC 权限矩阵 —— 前端按钮显隐与后端 rbacMiddleware 共用同一套动作名。
 * 调度员：登记/合并报修、派工；班组长：到场/处理/复电、申请备件；
 * 仓管（备件员）：审批备件、入库出库；审计员：只读 + 审计日志。
 */
export const Action = {
  FAULT_CREATE: "fault:create",
  FAULT_MERGE: "fault:merge",
  FAULT_GENERATE: "fault:generate",
  TICKET_DISPATCH: "ticket:dispatch",
  TICKET_ARRIVE: "ticket:arrive",
  TICKET_PROGRESS: "ticket:progress",
  TICKET_RESTORE: "ticket:restore",
  TICKET_CLOSE: "ticket:close",
  PART_APPLY: "part:apply",
  PART_APPROVE: "part:approve",
  PART_REJECT: "part:reject",
  PART_CONSUME: "part:consume",
  PART_RETURN: "part:return",
  PART_STOCK_ADJUST: "part:stock-adjust",
  CREW_DUTY_TOGGLE: "crew:duty-toggle",
  AUDIT_VIEW: "audit:view"
} as const;

export type Action = (typeof Action)[keyof typeof Action];

const ALL_TICKET_FLOW = [
  Action.TICKET_ARRIVE,
  Action.TICKET_PROGRESS,
  Action.TICKET_RESTORE,
  Action.TICKET_CLOSE
] as const;

export const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  [Role.DISPATCHER]: [
    Action.FAULT_CREATE,
    Action.FAULT_MERGE,
    Action.FAULT_GENERATE,
    Action.TICKET_DISPATCH,
    Action.AUDIT_VIEW
  ],
  [Role.LEADER]: [
    ...ALL_TICKET_FLOW,
    Action.PART_APPLY,
    Action.PART_CONSUME,
    Action.PART_RETURN,
    Action.CREW_DUTY_TOGGLE,
    Action.AUDIT_VIEW
  ],
  [Role.WAREHOUSE]: [
    Action.PART_APPROVE,
    Action.PART_REJECT,
    Action.PART_STOCK_ADJUST,
    Action.AUDIT_VIEW
  ],
  [Role.AUDITOR]: [Action.AUDIT_VIEW]
};

export const can = (role: Role, action: Action): boolean =>
  ROLE_PERMISSIONS[role]?.includes(action) ?? false;
