import { dataStore } from "./InMemoryStore";
import type { SparePartUsage, SparePartStock, StockTxn } from "../models/SparePartUsage";

export const sparePartUsageRepository = {
  findAllUsages(): SparePartUsage[] {
    return dataStore.getSnapshot().parts;
  },
  findAllStocks(): SparePartStock[] {
    return dataStore.getSnapshot().stocks;
  },
  findAllTxns(): StockTxn[] {
    return dataStore.getSnapshot().stockTxns;
  },
  findUsageById(id: number): SparePartUsage | undefined {
    return dataStore.getSnapshot().parts.find((p) => p.id === id);
  }
};
