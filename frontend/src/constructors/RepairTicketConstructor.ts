import type { RepairTicket } from "../types/RepairTicket";
import { TicketStatus } from "../constants/TicketStatus";
import { Priority } from "../constants/Priority";

export const createDefaultRepairTicket = (overrides: Partial<RepairTicket> = {}): RepairTicket => ({
  id: 0,
  fault_report_id: 0,
  merged_report_ids: [] as number[],
  team_id: null,
  dispatcher_id: 0,
  priority: Priority.MEDIUM,
  status: TicketStatus.WAIT_DISPATCH,
  assigned_at: null,
  arrived_at: null,
  repairing_at: null,
  restored_at: null,
  closed_at: null,
  created_at: new Date().toISOString(),
  restore_remark: null,
  ...overrides
});

/** 派工表单（调度员按技能/值班/备件情况派工） */
export const createDispatchForm = (): { team_id: number | null; priority: Priority } => ({
  team_id: null,
  priority: Priority.MEDIUM
});

export type DispatchForm = ReturnType<typeof createDispatchForm>;

export const createRepairTicketResponse = (row: RepairTicket): RepairTicket =>
  createDefaultRepairTicket(row);
