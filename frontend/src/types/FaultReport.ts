import type { FaultType } from "./FaultType";

/** 报修单状态：待处理 / 已生成工单 / 已合并（重复报修并入主单）/ 已复电 / 已归档 */
export type FaultStatus = "PENDING" | "TICKETED" | "MERGED" | "RESTORED" | "CLOSED";

export interface FaultReport {
  id: number;
  report_no: string;
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: FaultType;
  address_desc: string;
  /** 严重程度：一般 / 紧急 / 特急 */
  severity: "NORMAL" | "URGENT" | "CRITICAL";
  report_channel: "HOTLINE" | "APP" | "PATROL" | "ONSITE";
  status: FaultStatus;
  affected_users: number;
  created_at: string;
  /** 合并指向的主报修单 id；为空表示自身即主单 */
  merged_into_id: number | null;
  /** 由该（主）报修单生成的工单 id */
  ticket_id: number | null;
}
