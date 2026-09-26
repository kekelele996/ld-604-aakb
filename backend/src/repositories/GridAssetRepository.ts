import { db } from "./inMemoryDatabase";
import type { GridAsset } from "../types";

export const gridAssetRepository = {
  findAll: (): GridAsset[] => db.gridAssets,
  findById: (id: number): GridAsset | undefined => db.gridAssets.find((row) => row.id === id),
  save: (row: GridAsset): GridAsset => {
    const index = db.gridAssets.findIndex((item) => item.id === row.id);
    if (index >= 0) db.gridAssets[index] = row; else db.gridAssets.push(row);
    return row;
  }
};
