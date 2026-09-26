import type { GridAsset } from "../types/GridAsset";
import { AssetHealthStatus } from "../constants/AssetHealthStatus";

/** 默认资产对象（store 新建/表单初始结构必须走构造器，禁止页面散写） */
export const createDefaultGridAsset = (overrides: Partial<GridAsset> = {}): GridAsset => ({
  id: 0,
  asset_code: "",
  asset_type: "柱上变压器",
  feeder_line: "",
  voltage_level: "10kV",
  location_desc: "",
  health_status: AssetHealthStatus.NORMAL,
  owner_team_id: null,
  last_fault_at: null,
  fault_count: 0,
  ...overrides
});

/** 台账新增/编辑表单 */
export const createGridAssetForm = (): Partial<GridAsset> => ({
  asset_code: "",
  asset_type: "柱上变压器",
  feeder_line: "",
  voltage_level: "10kV",
  location_desc: "",
  health_status: AssetHealthStatus.NORMAL,
  owner_team_id: null
});

/** 详情响应（台账页历史故障卡片使用） */
export const createGridAssetResponse = (row: GridAsset): GridAsset & { health_text: string } => ({
  ...createDefaultGridAsset(row),
  health_text: row.health_status
});
