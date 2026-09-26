import { defineStore } from "pinia";
import { listAuditLogs } from "../api/AuditLog";
import type { AuditLog } from "../types/AuditLog";

/** 操作日志（审计）store：只追加、不可改，审计员与各页面抽屉共用 */
export const useAuditLogStore = defineStore("auditLog", {
  state: () => ({ rows: [] as AuditLog[], loading: false }),
  getters: {
    latest: (state) => (limit = 8) => state.rows.slice(0, limit),
    byTarget: (state) => (type: AuditLog["target_type"], id: string) =>
      state.rows.filter((row) => row.target_type === type && row.target_id === id)
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listAuditLogs();
      this.loading = false;
    }
  }
});
