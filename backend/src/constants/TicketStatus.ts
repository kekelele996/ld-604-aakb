export const TicketStatus = {
  WAIT_DISPATCH: "WAIT_DISPATCH",
  ASSIGNED: "ASSIGNED",
  ARRIVED: "ARRIVED",
  REPAIRING: "REPAIRING",
  RESTORED: "RESTORED",
  CLOSED: "CLOSED"
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TICKET_STATUS_FLOW: TicketStatus[] = [
  TicketStatus.WAIT_DISPATCH,
  TicketStatus.ASSIGNED,
  TicketStatus.ARRIVED,
  TicketStatus.REPAIRING,
  TicketStatus.RESTORED,
  TicketStatus.CLOSED
];
