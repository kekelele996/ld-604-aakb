import { defineStore } from "pinia";
import { listRepairTickets } from "../api/RepairTicket";
import * as ticketService from "../services/repairTicketService";
import { useSessionStore } from "./SessionStore";
import type { RepairTicket } from "../types/RepairTicket";

export const useRepairTicketStore = defineStore("repairTicket", {
  state: () => ({ rows: [] as RepairTicket[], loading: false }),
  getters: {
    byId: (state) => (id: number | null | undefined) => state.rows.find((row) => row.id === id),
    waitingCount: (state) => state.rows.filter((row) => row.status === "WAIT_DISPATCH").length,
    activeCount: (state) => state.rows.filter((row) => ["ASSIGNED", "ARRIVED", "REPAIRING"].includes(row.status)).length,
    restoredToday(state) {
      const today = new Date().toDateString();
      return state.rows.filter((row) => row.restored_at && new Date(row.restored_at).toDateString() === today).length;
    },
    reportsOf: () => (ticket: RepairTicket) => ticketService.getTicketReports(ticket),
    assetsOf: () => (ticket: RepairTicket) => ticketService.getTicketAssets(ticket)
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listRepairTickets();
      this.loading = false;
    },
    dispatch(ticketId: number, teamId: number) {
      const session = useSessionStore();
      return ticketService.dispatchTicket(session.ctx, ticketId, teamId);
    },
    advance(ticketId: number, restoreNote = "") {
      const session = useSessionStore();
      return ticketService.advanceTicket(session.ctx, ticketId, restoreNote);
    },
    nextStatus(ticket: RepairTicket) {
      return ticketService.nextStage(ticket);
    }
  }
});
