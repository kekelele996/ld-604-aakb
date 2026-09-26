import type { SparePartUsage, SparePart, StockLedger } from "../types/SparePartUsage";

export const createDefaultSparePartUsage = (overrides: Partial<SparePartUsage> = {}): SparePartUsage => ({
  id: 0,
  req_no: "",
  ticket_id: 0,
  part_id: 0,
  part_code: "",
  part_name: "",
  quantity: 1,
  warehouse_name: "",
  applicant: "",
  approved_by: null,
  approved_at: null,
  usage_status: "PENDING",
  reject_reason: null,
  created_at: "",
  ...overrides
});

/** 班组长备件申请表单 */
export interface PartUsageForm {
  ticket_id: number;
  part_id: number | null;
  quantity: number;
}

export const createPartUsageForm = (ticket_id: number): PartUsageForm => ({ ticket_id, part_id: null, quantity: 1 });

export const createSparePartUsageForm = createPartUsageForm;
export const createSparePartUsageResponse = (row: SparePartUsage) => ({ ...row });

export const createDefaultSparePart = (overrides: Partial<SparePart> = {}): SparePart => ({
  id: 0,
  part_code: "",
  part_name: "",
  spec: "",
  warehouse_name: "中心库",
  stock: 0,
  safety_stock: 0,
  unit: "件",
  ...overrides
});

export const createStockLedger = (overrides: Partial<StockLedger> = {}): StockLedger => ({
  id: 0,
  part_id: 0,
  part_code: "",
  change: 0,
  balance: 0,
  reason: "",
  ref_req_no: null,
  operator: "",
  created_at: "",
  ...overrides
});
