import { localDb } from "../mocks/localDb";
import type { SparePart, SparePartUsage, StockLedger } from "../types/SparePartUsage";

export async function listSpareParts(): Promise<SparePart[]> {
  return localDb.spareParts.map((row) => ({ ...row }));
}

export async function listSparePartUsages(): Promise<SparePartUsage[]> {
  return localDb.sparePartUsages.map((row) => ({ ...row }));
}

export async function listStockLedgers(): Promise<StockLedger[]> {
  return localDb.stockLedgers.map((row) => ({ ...row }));
}
