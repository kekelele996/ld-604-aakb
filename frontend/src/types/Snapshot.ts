import type { GridAsset } from "./GridAsset";
import type { FaultReport } from "./FaultReport";
import type { RepairTicket } from "./RepairTicket";
import type { Crew } from "./Crew";
import type { SparePartUsage, SparePartStock } from "./SparePartUsage";
import type { AuditLog, StockTxn } from "./Audit";

/**
 * 全量业务快照：所有 GET 页面共享同一份数据，
 * 每个写动作返回更新后的快照，前端整表替换，保证跨实体联动一致
 * （复电会同时改工单/报修/资产/班组/日志五处）。
 */
export interface Snapshot {
  gridAssets: GridAsset[];
  faults: FaultReport[];
  tickets: RepairTicket[];
  crews: Crew[];
  parts: SparePartUsage[];
  stocks: SparePartStock[];
  stockTxns: StockTxn[];
  auditLogs: AuditLog[];
  serverTime: string;
}
