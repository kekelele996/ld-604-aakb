import type { TicketStatus as Status } from "../constants/TicketStatus";
import type { Priority } from "../constants/Priority";

export interface RepairTicket {
  id: number;
  /** 主报修单 id */
  fault_report_id: number;
  /** 合并到本工单的全部报修单 id（含主单） */
  merged_report_ids: number[];
  team_id: number | null;
  dispatcher_id: number;
  priority: Priority;
  status: Status;
  assigned_at: string | null;
  arrived_at: string | null;
  repairing_at: string | null;
  restored_at: string | null;
  closed_at: string | null;
  created_at: string;
  /** 复电处置说明 */
  restore_remark: string | null;
}
