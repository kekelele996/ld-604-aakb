/**
 * 本地内存数据库：页面统一请求 /api，后端不可用时前端回退到本地数据。
 * 模块级单例深拷贝种子，保证刷新页面可重置，所有写操作经 service 层进行。
 */
import {
  gridAssets,
  faultReports,
  repairTickets,
  crews,
  spareParts,
  sparePartUsages,
  stockLedgers,
  auditLogs
} from "../mocks/seedData";
import type { GridAsset } from "../types/GridAsset";
import type { FaultReport } from "../types/FaultReport";
import type { RepairTicket } from "../types/RepairTicket";
import type { Crew } from "../types/Crew";
import type { SparePart, SparePartUsage, StockLedger } from "../types/SparePartUsage";
import type { AuditLog } from "../types/AuditLog";

const clone = <T>(rows: readonly T[]): T[] => rows.map((row) => JSON.parse(JSON.stringify(row)) as T);

export interface LocalDatabase {
  gridAssets: GridAsset[];
  faultReports: FaultReport[];
  repairTickets: RepairTicket[];
  crews: Crew[];
  spareParts: SparePart[];
  sparePartUsages: SparePartUsage[];
  stockLedgers: StockLedger[];
  auditLogs: AuditLog[];
  seq: Record<string, number>;
}

export function createLocalDatabase(): LocalDatabase {
  return {
    gridAssets: clone(gridAssets),
    faultReports: clone(faultReports),
    repairTickets: clone(repairTickets),
    crews: clone(crews),
    spareParts: clone(spareParts),
    sparePartUsages: clone(sparePartUsages),
    stockLedgers: clone(stockLedgers),
    auditLogs: clone(auditLogs),
    seq: {
      fault: 20,
      ticket: 20,
      usage: 20,
      log: 1000,
      ledger: 100
    }
  };
}

export const localDb: LocalDatabase = createLocalDatabase();

/** 重置为种子数据（页面顶部“重置本地数据”按钮） */
export function resetLocalDatabase(): void {
  const fresh = createLocalDatabase();
  localDb.gridAssets = fresh.gridAssets;
  localDb.faultReports = fresh.faultReports;
  localDb.repairTickets = fresh.repairTickets;
  localDb.crews = fresh.crews;
  localDb.spareParts = fresh.spareParts;
  localDb.sparePartUsages = fresh.sparePartUsages;
  localDb.stockLedgers = fresh.stockLedgers;
  localDb.auditLogs = fresh.auditLogs;
  localDb.seq = fresh.seq;
}
