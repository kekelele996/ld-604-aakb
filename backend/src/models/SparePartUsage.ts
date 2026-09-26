import type { PartStatus } from "../constants/Role";

export interface SparePartUsage {
  id: number;
  ticket_id: number;
  part_code: string;
  part_name: string;
  quantity: number;
  warehouse_name: string;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  usage_status: PartStatus;
  created_at: string;
}

export interface SparePartStock {
  part_code: string;
  part_name: string;
  warehouse_name: string;
  stock: number;
  safety_stock: number;
  unit: string;
}

export interface StockTxn {
  id: number;
  part_code: string;
  part_name: string;
  warehouse_name: string;
  change: number;
  balance: number;
  usage_id: number | null;
  operator: string;
  remark: string;
  created_at: string;
}
