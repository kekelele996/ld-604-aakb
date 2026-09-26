export const TicketStatus = ["WAIT_DISPATCH", "ASSIGNED", "ARRIVED", "REPAIRING", "RESTORED", "CLOSED"] as const;
export type TicketStatus = (typeof TicketStatus)[number];
export const TicketStatusText: Record<TicketStatus, string> = {
  WAIT_DISPATCH: "待派工",
  ASSIGNED: "已派工",
  ARRIVED: "已到场",
  REPAIRING: "处理中",
  RESTORED: "已复电",
  CLOSED: "已归档"
};
/** 工单状态推进顺序，供状态机、筛选器与时间线使用 */
export const TicketStatusFlow: TicketStatus[] = ["WAIT_DISPATCH", "ASSIGNED", "ARRIVED", "REPAIRING", "RESTORED", "CLOSED"];
/** 状态 -> 班组长推进动作名 */
export const TicketStatusNextAction: Partial<Record<TicketStatus, string>> = {
  ASSIGNED: "confirmArrive",
  ARRIVED: "startRepair",
  REPAIRING: "restore",
  RESTORED: "close"
};
