import {
  seedGridAssets, seedFaultReports, seedRepairTickets, seedCrews,
  seedSpareParts, seedSparePartUsages, seedStockLedgers, seedAuditLogs
} from "../seed";
import type {
  GridAsset, FaultReport, RepairTicket, Crew, SparePart, SparePartUsage, StockLedger, AuditLog
} from "../types";

export interface InMemoryDatabase {
  gridAssets: GridAsset[];
  faultReports: FaultReport[];
  repairTickets: RepairTicket[];
  crews: Crew[];
  spareParts: SparePart[];
  sparePartUsages: SparePartUsage[];
  stockLedgers: StockLedger[];
  auditLogs: AuditLog[];
  seq: { fault: number; ticket: number; usage: number; log: number; ledger: number; asset: number; crew: number };
}

const clone = <T>(rows: readonly T[]): T[] => rows.map((row) => JSON.parse(JSON.stringify(row)) as T);

export function createDatabase(): InMemoryDatabase {
  return {
    gridAssets: clone(seedGridAssets),
    faultReports: clone(seedFaultReports),
    repairTickets: clone(seedRepairTickets),
    crews: clone(seedCrews),
    spareParts: clone(seedSpareParts),
    sparePartUsages: clone(seedSparePartUsages),
    stockLedgers: clone(seedStockLedgers),
    auditLogs: clone(seedAuditLogs),
    seq: { fault: 20, ticket: 20, usage: 20, log: 1000, ledger: 100, asset: 100, crew: 100 }
  };
}

export const db: InMemoryDatabase = createDatabase();
