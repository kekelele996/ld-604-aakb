import { defineStore } from "pinia";
import { listFaultReports } from "../api/FaultReport";
import * as faultService from "../services/faultReportService";
import { useSessionStore } from "./SessionStore";
import type { FaultReport } from "../types/FaultReport";
import type { FaultReportForm } from "../constructors/FaultReportConstructor";

export const useFaultReportStore = defineStore("faultReport", {
  state: () => ({ rows: [] as FaultReport[], loading: false }),
  getters: {
    byId: (state) => (id: number | null | undefined) => state.rows.find((row) => row.id === id),
    pendingCount: (state) => state.rows.filter((row) => row.status === "PENDING" && row.merged_into_id === null).length,
    duplicateCandidates: (state) => (report: FaultReport) => {
      // 复用 service 判定（同馈线 + 未结主单），store 内直接比对避免循环引用
      return faultService.findDuplicateCandidates(report);
    }
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listFaultReports();
      this.loading = false;
    },
    register(form: FaultReportForm) {
      const session = useSessionStore();
      return faultService.registerFaultReport(session.ctx, form);
    },
    merge(sourceId: number, targetId: number) {
      const session = useSessionStore();
      return faultService.mergeFaultReport(session.ctx, sourceId, targetId);
    },
    createTicket(primaryId: number) {
      const session = useSessionStore();
      return faultService.createTicket(session.ctx, primaryId);
    }
  }
});
