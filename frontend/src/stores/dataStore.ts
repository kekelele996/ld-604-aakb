import { defineStore } from "pinia";
import type { Snapshot } from "../types/Snapshot";
import { fetchSnapshot, resetSnapshot } from "../api/snapshot";
import { buildSeedSnapshot } from "../mocks/snapshot";

/**
 * 全局数据 store：五个实体 store 共享同一份快照。
 * 任何写动作（api 层）返回新快照后统一 apply，保证
 * “复电同时更新故障和资产状态”这类跨实体联动一次渲染生效。
 */
export const useDataStore = defineStore("data", {
  state: () => ({
    snapshot: buildSeedSnapshot() as Snapshot,
    loading: false,
    lastError: "" as string
  }),
  getters: {
    gridAssets: (s) => s.snapshot.gridAssets,
    faults: (s) => s.snapshot.faults,
    tickets: (s) => s.snapshot.tickets,
    crews: (s) => s.snapshot.crews,
    parts: (s) => s.snapshot.parts,
    stocks: (s) => s.snapshot.stocks,
    stockTxns: (s) => s.snapshot.stockTxns,
    auditLogs: (s) => s.snapshot.auditLogs
  },
  actions: {
    async load() {
      this.loading = true;
      this.lastError = "";
      try {
        this.snapshot = await fetchSnapshot();
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
      } finally {
        this.loading = false;
      }
    },
    apply(next: Snapshot) {
      this.snapshot = next;
      this.lastError = "";
    },
    async resetDemo() {
      this.snapshot = await resetSnapshot();
    }
  }
});
