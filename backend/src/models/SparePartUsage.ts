import type { SparePartUsage, SparePart } from "../types";
export const isPending = (usage: SparePartUsage): boolean => usage.usage_status === "PENDING";
export const isLowStock = (part: SparePart): boolean => part.stock <= part.safety_stock;
