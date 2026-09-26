import type { RepairTicket } from "../types/RepairTicket";

export const createDefaultRepairTicket = (overrides: Partial<RepairTicket> = {}): RepairTicket => ({
  id: 0,
  ticket_no: "",
  fault_report_id: 0,
  merged_report_ids: [],
  team_id: null,
  dispatcher_id: 0,
  priority: "NORMAL",
  status: "WAIT_DISPATCH",
  assigned_at: null,
  arrived_at: null,
  repairing_at: null,
  restored_at: null,
  closed_at: null,
  restore_note: null,
  created_at: "",
  ...overrides
});

/** 合并报修单后生成工单的入参构造 */
export interface CreateTicketForm {
  fault_report_id: number;
  merged_report_ids: number[];
  priority: RepairTicket["priority"];
}

export const createTicketForm = (fault_report_id: number, merged_report_ids: number[] = [], priority: RepairTicket["priority"] = "NORMAL"): CreateTicketForm => ({
  fault_report_id,
  merged_report_ids,
  priority
});

/** 派工表单 */
export interface DispatchForm {
  ticket_id: number;
  team_id: number;
}

export const createDispatchForm = (ticket_id: number, team_id: number): DispatchForm => ({ ticket_id, team_id });

/** 复电确认表单 */
export interface RestoreForm {
  ticket_id: number;
  restore_note: string;
}

export const createRestoreForm = (ticket_id: number): RestoreForm => ({ ticket_id, restore_note: "" });

export const createRepairTicketResponse = (row: RepairTicket) => ({ ...row });
