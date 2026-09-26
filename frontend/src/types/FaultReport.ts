import type { FaultType } from "../constants/FaultType";
import type { Severity } from "../constants/Severity";
import type { ReportChannel } from "../constants/ReportChannel";
import type { FaultStatus } from "../constants/FaultStatus";

export interface FaultReport {
  id: number;
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: FaultType;
  address_desc: string;
  severity: Severity;
  report_channel: ReportChannel;
  status: FaultStatus;
  /** 合并目标：被判定为同线路重复报修时指向主报修单 */
  merged_into_id: number | null;
  /** 生成的工单 */
  ticket_id: number | null;
  created_at: string;
}
