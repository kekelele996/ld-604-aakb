import type { SparePartUsage } from "../types/SparePartUsage";
import { PartStatus } from "../constants/PartStatus";

export const createDefaultSparePartUsage = (overrides: Partial<SparePartUsage> = {}): SparePartUsage => ({
  id: 0,
  ticket_id: 0,
  part_code: "",
  part_name: "",
  quantity: 1,
  warehouse_name: "中心仓库",
  requested_by: "",
  approved_by: null,
  approved_at: null,
  reject_reason: null,
  usage_status: PartStatus.PENDING,
  created_at: new Date().toISOString(),
  ...overrides
});

/** 班组长备件申请表单 */
export const createSparePartForm = (): { ticket_id: number; part_code: string; quantity: number } => ({
  ticket_id: 0,
  part_code: "",
  quantity: 1
});

export type SparePartForm = ReturnType<typeof createSparePartForm>;

export const createSparePartUsageResponse = (row: SparePartUsage): SparePartUsage =>
  createDefaultSparePartUsage(row);
