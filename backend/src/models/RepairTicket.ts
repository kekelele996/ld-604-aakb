import type { TicketStatus } from "../constants/TicketStatus";
import type { Priority } from "../constants/Role";

export interface RepairTicket {
  id: number;
  fault_report_id: number;
  merged_report_ids: number[];
  team_id: number | null;
  dispatcher_id: number;
  priority: Priority;
  status: TicketStatus;
  assigned_at: string | null;
  arrived_at: string | null;
  repairing_at: string | null;
  restored_at: string | null;
  closed_at: string | null;
  created_at: string;
  restore_remark: string | null;
}
