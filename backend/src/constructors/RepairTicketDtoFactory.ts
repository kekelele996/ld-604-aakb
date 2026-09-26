import type { RepairTicket } from "../models/RepairTicket";
import { TicketStatus } from "../constants/TicketStatus";
import { Priority } from "../constants/Role";

export const createRepairTicketDto = (body: Partial<RepairTicket> = {}): RepairTicket => ({
  id: body.id ?? 0,
  fault_report_id: body.fault_report_id ?? 0,
  merged_report_ids: body.merged_report_ids ?? [],
  team_id: body.team_id ?? null,
  dispatcher_id: body.dispatcher_id ?? 0,
  priority: body.priority ?? Priority.MEDIUM,
  status: body.status ?? TicketStatus.WAIT_DISPATCH,
  assigned_at: body.assigned_at ?? null,
  arrived_at: body.arrived_at ?? null,
  repairing_at: body.repairing_at ?? null,
  restored_at: body.restored_at ?? null,
  closed_at: body.closed_at ?? null,
  created_at: body.created_at ?? new Date().toISOString(),
  restore_remark: body.restore_remark ?? null
});

export const toRepairTicketResponse = (row: RepairTicket): RepairTicket => ({ ...row });
