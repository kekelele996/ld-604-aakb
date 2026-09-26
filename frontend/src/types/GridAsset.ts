import type { FaultType } from "./FaultType";
import type { AssetHealthStatus } from "./AssetHealthStatus";

export interface GridAsset {
  id: number;
  asset_code: string;
  asset_type: FaultType | "TRANSFORMER" | "SWITCH" | "LINE" | "METER";
  feeder_line: string;
  voltage_level: "0.4kV" | "10kV" | "35kV";
  location_desc: string;
  health_status: AssetHealthStatus;
  owner_team_id: number | null;
  /** 最近一次故障时间，资产页历史故障列表排序辅助字段 */
  last_fault_at: string | null;
}
