import type { PartStatus } from "../constants/PartStatus";

export interface SparePartUsage {
  id: number;
  ticket_id: number;
  part_code: string;
  part_name: string;
  quantity: number;
  warehouse_name: string;
  /** 申请人（班组长） */
  requested_by: string;
  /** 审批人（仓管），审批前为 null —— 未审批绝不扣库存 */
  approved_by: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  usage_status: PartStatus;
  created_at: string;
}

/** 备件库存主数据 */
export interface SparePartStock {
  part_code: string;
  part_name: string;
  warehouse_name: string;
  stock: number;
  safety_stock: number;
  unit: string;
}
