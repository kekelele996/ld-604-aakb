/** 备件申请单状态：待审批 / 已批准（已扣库存）/ 已驳回 / 已归还（退回库存） */
export type PartUsageStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";

export interface SparePartUsage {
  id: number;
  req_no: string;
  ticket_id: number;
  part_id: number;
  part_code: string;
  part_name: string;
  quantity: number;
  warehouse_name: string;
  applicant: string;
  approved_by: string | null;
  approved_at: string | null;
  usage_status: PartUsageStatus;
  reject_reason: string | null;
  created_at: string;
}

/** 备件库存台账 */
export interface SparePart {
  id: number;
  part_code: string;
  part_name: string;
  spec: string;
  warehouse_name: string;
  stock: number;
  safety_stock: number;
  unit: string;
}

/** 库存流水（审批通过扣减 / 归还回补 / 盘点调整） */
export interface StockLedger {
  id: number;
  part_id: number;
  part_code: string;
  change: number;
  balance: number;
  reason: string;
  ref_req_no: string | null;
  operator: string;
  created_at: string;
}
