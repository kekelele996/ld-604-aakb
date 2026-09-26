import type { FaultType } from "../constants/FaultType";
import type { Severity, FaultStatus } from "../constants/Role";

export interface FaultReport {
  id: number;
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: FaultType;
  address_desc: string;
  severity: Severity;
  report_channel: string;
  status: FaultStatus;
  merged_into_id: number | null;
  ticket_id: number | null;
  created_at: string;
}
