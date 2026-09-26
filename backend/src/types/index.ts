import type { FaultType } from "../constants/FaultType";
import type { TicketStatus } from "../constants/TicketStatus";
import type { AssetHealthStatus } from "../constants/AssetHealthStatus";

export type Role = "DISPATCHER" | "LEADER" | "WAREHOUSE" | "AUDITOR";
export type FaultStatus = "PENDING" | "TICKETED" | "MERGED" | "RESTORED" | "CLOSED";
export type CrewDutyStatus = "ON_DUTY" | "ON_SITE" | "OFF_DUTY";
export type PartUsageStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
export type Priority = "NORMAL" | "URGENT" | "CRITICAL";

export interface GridAsset {
  id: number; asset_code: string; asset_type: string; feeder_line: string; voltage_level: string;
  location_desc: string; health_status: AssetHealthStatus; owner_team_id: number | null; last_fault_at: string | null;
}
export interface FaultReport {
  id: number; report_no: string; reporter_name: string; phone: string; asset_id: number; fault_type: FaultType;
  address_desc: string; severity: Priority; report_channel: "HOTLINE" | "APP" | "PATROL" | "ONSITE";
  status: FaultStatus; affected_users: number; created_at: string; merged_into_id: number | null; ticket_id: number | null;
}
export interface RepairTicket {
  id: number; ticket_no: string; fault_report_id: number; merged_report_ids: number[]; team_id: number | null;
  dispatcher_id: number; priority: Priority; status: TicketStatus; assigned_at: string | null; arrived_at: string | null;
  repairing_at: string | null; restored_at: string | null; closed_at: string | null; restore_note: string | null; created_at: string;
}
export interface Crew {
  id: number; name: string; leader_id: number; leader_name: string; skill_tags: string[];
  duty_status: CrewDutyStatus; current_ticket_id: number | null; contact_phone: string;
}
export interface SparePart {
  id: number; part_code: string; part_name: string; spec: string; warehouse_name: string;
  stock: number; safety_stock: number; unit: string;
}
export interface SparePartUsage {
  id: number; req_no: string; ticket_id: number; part_id: number; part_code: string; part_name: string;
  quantity: number; warehouse_name: string; applicant: string; approved_by: string | null; approved_at: string | null;
  usage_status: PartUsageStatus; reject_reason: string | null; created_at: string;
}
export interface StockLedger {
  id: number; part_id: number; part_code: string; change: number; balance: number; reason: string;
  ref_req_no: string | null; operator: string; created_at: string;
}
export interface AuditLog {
  id: number; actor: string; actor_role: Role; action: string;
  target_type: "FaultReport" | "RepairTicket" | "Crew" | "SparePartUsage" | "SparePart" | "GridAsset" | "System";
  target_id: string; detail: string; created_at: string;
}

// 请求载荷（controller 入参校验使用）
export interface FaultReportPayload {
  reporter_name?: unknown; phone?: unknown; asset_id?: unknown; fault_type?: unknown;
  address_desc?: unknown; severity?: unknown; report_channel?: unknown; affected_users?: unknown;
}
export interface MergePayload { source_id?: unknown; target_id?: unknown }
export interface DispatchPayload { team_id?: unknown }
export interface RestorePayload { restore_note?: unknown }
export interface PartUsagePayload { ticket_id?: unknown; part_id?: unknown; quantity?: unknown }
export interface ApprovePayload { reject_reason?: unknown }
export interface StockAdjustPayload { stock?: unknown }
export interface GridAssetPayload {
  asset_code?: unknown; asset_type?: unknown; feeder_line?: unknown; voltage_level?: unknown;
  location_desc?: unknown; health_status?: unknown; owner_team_id?: unknown;
}
export interface CrewPayload { name?: unknown; leader_name?: unknown; skill_tags?: unknown; contact_phone?: unknown }
export type SparePartUsagePayloadRecord = Record<string, unknown>;
