import type { Priority } from "../constants/Role";

export interface DispatchPayload {
  ticketId: number;
  teamId: number;
  priority: Priority;
}

export interface TicketIdPayload {
  ticketId: number;
  remark?: string;
}
