import type { Snapshot } from "../types/Snapshot";
import {
  gridAssets,
  faultReports,
  repairTickets,
  crews,
  sparePartUsages,
  sparePartStocks,
  stockTxns,
  auditLogs
} from "./seedData";

/** 深拷贝种子，避免运行期写脏初始数据（重置演示数据时复用） */
export const buildSeedSnapshot = (): Snapshot => ({
  gridAssets: structuredClone(gridAssets),
  faults: structuredClone(faultReports),
  tickets: structuredClone(repairTickets),
  crews: structuredClone(crews),
  parts: structuredClone(sparePartUsages),
  stocks: structuredClone(sparePartStocks),
  stockTxns: structuredClone(stockTxns),
  auditLogs: structuredClone(auditLogs),
  serverTime: new Date().toISOString()
});
