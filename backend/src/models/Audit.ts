import type { Role } from "../constants/Role";

export interface AuditLog {
  id: number;
  actor: string;
  actor_role: Role;
  action: string;
  target_type: string;
  target_id: number | string;
  created_at: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  role: Role;
}

/** 全量快照，GET /api/snapshot 返回 */
export interface Snapshot {
  gridAssets: import("./GridAsset").GridAsset[];
  faults: import("./FaultReport").FaultReport[];
  tickets: import("./RepairTicket").RepairTicket[];
  crews: import("./Crew").Crew[];
  parts: import("./SparePartUsage").SparePartUsage[];
  stocks: import("./SparePartUsage").SparePartStock[];
  stockTxns: import("./SparePartUsage").StockTxn[];
  auditLogs: AuditLog[];
  serverTime: string;
}

/** POST /api/actions/:name 请求体 */
export interface ActionRequest {
  args: unknown[];
  actor: CurrentUser;
}
