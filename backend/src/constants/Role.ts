/** 角色 / RBAC 动作（与前端 constants/Role、permissions 镜像） */
export const Role = {
  DISPATCHER: "DISPATCHER",
  LEADER: "LEADER",
  WAREHOUSE: "WAREHOUSE",
  AUDITOR: "AUDITOR"
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const CrewDutyStatus = { ON_DUTY: "ON_DUTY", BUSY: "BUSY", OFF_DUTY: "OFF_DUTY" } as const;
export type CrewDutyStatus = (typeof CrewDutyStatus)[keyof typeof CrewDutyStatus];

export const PartStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CONSUMED: "CONSUMED",
  RETURNED: "RETURNED"
} as const;
export type PartStatus = (typeof PartStatus)[keyof typeof PartStatus];

export const FaultStatus = {
  PENDING: "PENDING",
  MERGED: "MERGED",
  TICKETED: "TICKETED",
  RESOLVED: "RESOLVED"
} as const;
export type FaultStatus = (typeof FaultStatus)[keyof typeof FaultStatus];

export const Severity = { NORMAL: "NORMAL", URGENT: "URGENT", CRITICAL: "CRITICAL" } as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const Priority = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

/** 动作 → 允许的角色，rbacMiddleware 使用 */
export const ACTION_ROLES: Record<string, Role[]> = {
  createFault: [Role.DISPATCHER],
  mergeFault: [Role.DISPATCHER],
  generateTicket: [Role.DISPATCHER],
  dispatchTicket: [Role.DISPATCHER],
  arriveTicket: [Role.LEADER],
  progressTicket: [Role.LEADER],
  restoreTicket: [Role.LEADER],
  closeTicket: [Role.LEADER],
  toggleCrewDuty: [Role.LEADER],
  applyPart: [Role.LEADER],
  approvePart: [Role.WAREHOUSE],
  rejectPart: [Role.WAREHOUSE],
  consumePart: [Role.LEADER],
  returnPart: [Role.LEADER],
  adjustStock: [Role.WAREHOUSE]
};
