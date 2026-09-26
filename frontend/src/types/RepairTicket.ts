import type { TicketStatus } from "./TicketStatus";

export type TicketPriority = "NORMAL" | "URGENT" | "CRITICAL";

export interface RepairTicket {
  id: number;
  ticket_no: string;
  /** 主故障报修单 id（同线路重复报修合并后生成工单） */
  fault_report_id: number;
  /** 合并到本工单的报修单 id 列表 */
  merged_report_ids: number[];
  team_id: number | null;
  dispatcher_id: number;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_at: string | null;
  arrived_at: string | null;
  repairing_at: string | null;
  restored_at: string | null;
  closed_at: string | null;
  /** 复电处理结论 */
  restore_note: string | null;
  created_at: string;
}
