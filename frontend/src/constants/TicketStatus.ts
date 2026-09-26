/**
 * 工单状态枚举 —— 贯穿 登记→派工→到场→处理→复电→归档
 * 出现位置：types/RepairTicket.ts、constructors/RepairTicketConstructor.ts、
 * constants/logTemplates.ts、constants/errorMessages.ts、
 * TicketsPage/DashboardPage 筛选器、StatusBadge 展示、
 * hooks/useTicketFlow.ts、后端 constants/TicketStatus.ts
 */
export const TicketStatus = {
  WAIT_DISPATCH: "WAIT_DISPATCH",
  ASSIGNED: "ASSIGNED",
  ARRIVED: "ARRIVED",
  REPAIRING: "REPAIRING",
  RESTORED: "RESTORED",
  CLOSED: "CLOSED"
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketStatusText: Record<TicketStatus, string> = {
  WAIT_DISPATCH: "待派工",
  ASSIGNED: "已派工",
  ARRIVED: "已到场",
  REPAIRING: "处理中",
  RESTORED: "已复电",
  CLOSED: "已归档"
};

/** 工单状态流转顺序，hooks/useTicketFlow 与 TimelineList 共同依赖 */
export const TicketStatusFlow: TicketStatus[] = [
  TicketStatus.WAIT_DISPATCH,
  TicketStatus.ASSIGNED,
  TicketStatus.ARRIVED,
  TicketStatus.REPAIRING,
  TicketStatus.RESTORED,
  TicketStatus.CLOSED
];
