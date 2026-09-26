import type { SparePartUsage } from "../models/SparePartUsage";
import { PartStatus } from "../constants/Role";

export const createSparePartUsageDto = (body: Partial<SparePartUsage> = {}): SparePartUsage => ({
  id: body.id ?? 0,
  ticket_id: body.ticket_id ?? 0,
  part_code: body.part_code ?? "",
  part_name: body.part_name ?? "",
  quantity: body.quantity ?? 1,
  warehouse_name: body.warehouse_name ?? "中心仓库",
  requested_by: body.requested_by ?? "",
  approved_by: body.approved_by ?? null,
  approved_at: body.approved_at ?? null,
  reject_reason: body.reject_reason ?? null,
  usage_status: body.usage_status ?? PartStatus.PENDING,
  created_at: body.created_at ?? new Date().toISOString()
});

export const toSparePartUsageResponse = (row: SparePartUsage): SparePartUsage => ({ ...row });
