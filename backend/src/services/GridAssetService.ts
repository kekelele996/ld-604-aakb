import { gridAssetRepository } from "../repositories/GridAssetRepository";
import type { GridAsset } from "../models/GridAsset";

export const gridAssetService = {
  list(): GridAsset[] {
    return gridAssetRepository.findAll();
  },
  feederLines(): string[] {
    return gridAssetRepository.findFeederLines();
  },
  detail(id: number): GridAsset | undefined {
    return gridAssetRepository.findById(id);
  }
};
