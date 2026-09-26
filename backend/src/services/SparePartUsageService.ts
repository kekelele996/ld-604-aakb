import { dataStore } from "../repositories/InMemoryStore";
import { sparePartUsageRepository } from "../repositories/SparePartUsageRepository";
import {
  applyPart, approvePart, rejectPart, consumePart, returnPart, adjustStock
} from "./engine";
import type { SparePartUsage, SparePartStock, StockTxn } from "../models/SparePartUsage";
import type { CurrentUser } from "../models/Audit";

export const sparePartUsageService = {
  listUsages(): SparePartUsage[] {
    return sparePartUsageRepository.findAllUsages();
  },
  listStocks(): SparePartStock[] {
    return sparePartUsageRepository.findAllStocks();
  },
  listTxns(): StockTxn[] {
    return sparePartUsageRepository.findAllTxns();
  },

  apply(ticketId: number, partCode: string, quantity: number, actor: CurrentUser) {
    const next = applyPart(dataStore.getSnapshot(), ticketId, partCode, quantity, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  approve(usageId: number, actor: CurrentUser) {
    const next = approvePart(dataStore.getSnapshot(), usageId, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  reject(usageId: number, reason: string, actor: CurrentUser) {
    const next = rejectPart(dataStore.getSnapshot(), usageId, reason, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  consume(usageId: number, actor: CurrentUser) {
    const next = consumePart(dataStore.getSnapshot(), usageId, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  returnPart(usageId: number, actor: CurrentUser) {
    const next = returnPart(dataStore.getSnapshot(), usageId, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  adjustStock(partCode: string, newStock: number, actor: CurrentUser) {
    const next = adjustStock(dataStore.getSnapshot(), partCode, newStock, actor);
    dataStore.setSnapshot(next);
    return next;
  }
};
