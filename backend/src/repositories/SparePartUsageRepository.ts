import { db } from "./inMemoryDatabase";
import type { SparePart, SparePartUsage, StockLedger } from "../types";

export const sparePartUsageRepository = {
  findAllUsages: (): SparePartUsage[] => db.sparePartUsages,
  findUsageById: (id: number): SparePartUsage | undefined => db.sparePartUsages.find((row) => row.id === id),
  saveUsage: (row: SparePartUsage): SparePartUsage => {
    const index = db.sparePartUsages.findIndex((item) => item.id === row.id);
    if (index >= 0) db.sparePartUsages[index] = row; else db.sparePartUsages.unshift(row);
    return row;
  },
  findAllParts: (): SparePart[] => db.spareParts,
  findPartById: (id: number): SparePart | undefined => db.spareParts.find((row) => row.id === id),
  savePart: (row: SparePart): SparePart => {
    const index = db.spareParts.findIndex((item) => item.id === row.id);
    if (index >= 0) db.spareParts[index] = row; else db.spareParts.push(row);
    return row;
  },
  findAllLedgers: (): StockLedger[] => db.stockLedgers,
  saveLedger: (row: StockLedger): StockLedger => { db.stockLedgers.unshift(row); return row; }
};

export const auditLogRepository = {
  findAll: () => db.auditLogs,
  save: (row: import("../types").AuditLog) => { db.auditLogs.unshift(row); return row; }
};
