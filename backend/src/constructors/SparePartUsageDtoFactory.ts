import type { SparePartUsage, SparePart, StockLedger } from "../types";
export const toSparePartUsageDto = (row: SparePartUsage): SparePartUsage => ({ ...row });
export const toSparePartDto = (row: SparePart): SparePart => ({ ...row });
export const toStockLedgerDto = (row: StockLedger): StockLedger => ({ ...row });
export const createPartUsagePayload = () => ({ ticket_id: 0, part_id: 0, quantity: 1 });
