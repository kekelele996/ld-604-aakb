import type { GridAsset } from "../types";
export const isDangerous = (asset: GridAsset): boolean => asset.health_status === "DANGEROUS";
export const needsAttention = (asset: GridAsset): boolean => asset.health_status !== "NORMAL";
