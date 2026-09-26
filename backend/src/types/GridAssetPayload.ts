import type { AssetHealthStatus } from "../constants/AssetHealthStatus";

/** 资产只读，台账维护保留扩展入口 */
export interface GridAssetPayload {
  asset_code?: string;
  asset_type?: string;
  feeder_line?: string;
  voltage_level?: string;
  location_desc?: string;
  health_status?: AssetHealthStatus;
  owner_team_id?: number | null;
}
