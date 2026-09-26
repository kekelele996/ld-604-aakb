import type { AssetHealthStatus } from "../constants/AssetHealthStatus";

export interface GridAsset {
  id: number;
  asset_code: string;
  asset_type: string;
  feeder_line: string;
  voltage_level: string;
  location_desc: string;
  health_status: AssetHealthStatus;
  owner_team_id: number | null;
  last_fault_at: string | null;
  fault_count: number;
}
