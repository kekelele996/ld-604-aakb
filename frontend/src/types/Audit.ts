import type { Role } from "../constants/Role";

export interface AuditLog {
  id: number;
  /** 操作人显示名 */
  actor: string;
  actor_role: Role;
  /** 日志模板渲染后的中文描述 */
  action: string;
  target_type: string;
  target_id: number | string;
  created_at: string;
}

export interface StockTxn {
  id: number;
  part_code: string;
  part_name: string;
  warehouse_name: string;
  /** 正入库 / 负出库 */
  change: number;
  balance: number;
  usage_id: number | null;
  operator: string;
  remark: string;
  created_at: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  role: Role;
}
