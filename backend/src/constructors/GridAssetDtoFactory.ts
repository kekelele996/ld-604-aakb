import type { GridAsset } from "../types";

/** 响应 DTO：隔离内部字段（本地演示逐字返回，但保持工厂层以便扩展） */
export const toGridAssetDto = (row: GridAsset): GridAsset => ({ ...row });
export const toGridAssetListDto = (rows: GridAsset[]): GridAsset[] => rows.map(toGridAssetDto);
export const createGridAssetPayload = (): Partial<GridAsset> => ({
  asset_code: "", asset_type: "LINE", feeder_line: "", voltage_level: "10kV", location_desc: "", health_status: "NORMAL"
});
