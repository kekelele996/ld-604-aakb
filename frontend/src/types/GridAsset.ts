import type { AssetHealthStatus as Health } from "../constants/AssetHealthStatus";

export interface GridAsset {
  id: number;
  asset_code: string;
  /** 设备类别：柱上变压器 / 架空线路 / 环网柜 / 分支箱 等 */
  asset_type: string;
  /** 所属馈线（线路），同线路重复报修合并的判定字段 */
  feeder_line: string;
  voltage_level: string;
  location_desc: string;
  health_status: Health;
  owner_team_id: number | null;
  /** 最近一次故障时间，资产台账“历史故障”用 */
  last_fault_at: string | null;
  fault_count: number;
}
