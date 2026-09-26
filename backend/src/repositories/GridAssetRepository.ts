import { dataStore } from "./InMemoryStore";
import type { GridAsset } from "../models/GridAsset";

/** 资产数据访问层（台账只读，健康度由复电事务回写） */
export const gridAssetRepository = {
  findAll(): GridAsset[] {
    return dataStore.getSnapshot().gridAssets;
  },
  findById(id: number): GridAsset | undefined {
    return dataStore.getSnapshot().gridAssets.find((a) => a.id === id);
  },
  findFeederLines(): string[] {
    return [...new Set(this.findAll().map((a) => a.feeder_line))];
  }
};
