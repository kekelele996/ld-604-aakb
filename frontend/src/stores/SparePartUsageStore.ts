import { defineStore } from "pinia";
import { listSpareParts, listSparePartUsages, listStockLedgers } from "../api/SparePartUsage";
import * as partService from "../services/sparePartService";
import { useSessionStore } from "./SessionStore";
import type { SparePart, SparePartUsage, StockLedger } from "../types/SparePartUsage";

export const useSparePartUsageStore = defineStore("sparePartUsage", {
  state: () => ({
    parts: [] as SparePart[],
    rows: [] as SparePartUsage[],
    ledgers: [] as StockLedger[],
    loading: false
  }),
  getters: {
    partById: (state) => (id: number | null | undefined) => state.parts.find((row) => row.id === id),
    pendingCount: (state) => state.rows.filter((row) => row.usage_status === "PENDING").length,
    lowStockParts: (state) => state.parts.filter((row) => row.stock <= row.safety_stock),
    usagesByTicket: (state) => (ticketId: number) => state.rows.filter((row) => row.ticket_id === ticketId)
  },
  actions: {
    async load() {
      this.loading = true;
      const [parts, rows, ledgers] = await Promise.all([listSpareParts(), listSparePartUsages(), listStockLedgers()]);
      this.parts = parts;
      this.rows = rows;
      this.ledgers = ledgers;
      this.loading = false;
    },
    apply(ticketId: number, partId: number, quantity: number) {
      const session = useSessionStore();
      return partService.applyPart(session.ctx, ticketId, partId, quantity);
    },
    approve(reqId: number) {
      const session = useSessionStore();
      return partService.approvePart(session.ctx, reqId);
    },
    reject(reqId: number, reason: string) {
      const session = useSessionStore();
      return partService.rejectPart(session.ctx, reqId, reason);
    },
    returnPart(reqId: number, quantity: number) {
      const session = useSessionStore();
      return partService.returnPart(session.ctx, reqId, quantity);
    },
    adjustStock(partId: number, targetStock: number) {
      const session = useSessionStore();
      return partService.adjustStock(session.ctx, partId, targetStock);
    }
  }
});
