import { localDb } from "../mocks/localDb";
import type { GridAsset } from "../types/GridAsset";

/**
 * 统一 /api 数据访问层。当前版本使用本地内存数据（mocks/localDb）。
 * 后端在线时可在此切换为 fetch("/api/grid-assets")，store 与页面无需改动。
 */
export async function listGridAssets(): Promise<GridAsset[]> {
  return localDb.gridAssets.map((row) => ({ ...row }));
}

export async function listFeederLines(): Promise<string[]> {
  return [...new Set(localDb.gridAssets.map((row) => row.feeder_line))];
}
