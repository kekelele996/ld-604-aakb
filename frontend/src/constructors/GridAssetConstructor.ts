import type { GridAsset } from "../types/GridAsset";

export const createDefaultGridAsset = (overrides: Partial<GridAsset> = {}): GridAsset => ({
  id: 0,
  asset_code: "",
  asset_type: "LINE",
  feeder_line: "",
  voltage_level: "10kV",
  location_desc: "",
  health_status: "NORMAL",
  owner_team_id: null,
  last_fault_at: null,
  ...overrides
});

/** 登记表单构造（提交前由 service 补齐编号/归属） */
export const createGridAssetForm = (): Partial<GridAsset> => ({
  asset_code: "",
  asset_type: "LINE",
  feeder_line: "",
  voltage_level: "10kV",
  location_desc: "",
  health_status: "NORMAL"
});

/** 列表行响应构造：台账页行视图 */
export const createGridAssetResponse = (row: GridAsset) => ({ ...row });
