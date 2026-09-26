import type { GridAsset } from "../models/GridAsset";
import { AssetHealthStatus } from "../constants/AssetHealthStatus";

/** 请求体 → 规范实体（默认结构集中，controller 不散写） */
export const createGridAssetDto = (body: Partial<GridAsset> = {}): GridAsset => ({
  id: body.id ?? 0,
  asset_code: body.asset_code ?? "",
  asset_type: body.asset_type ?? "柱上变压器",
  feeder_line: body.feeder_line ?? "",
  voltage_level: body.voltage_level ?? "10kV",
  location_desc: body.location_desc ?? "",
  health_status: body.health_status ?? AssetHealthStatus.NORMAL,
  owner_team_id: body.owner_team_id ?? null,
  last_fault_at: body.last_fault_at ?? null,
  fault_count: body.fault_count ?? 0
});

/** 列表行响应（剥离内部字段时使用） */
export const toGridAssetResponse = (row: GridAsset): GridAsset => ({ ...row });
