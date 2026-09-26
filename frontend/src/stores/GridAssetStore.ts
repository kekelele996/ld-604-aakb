import { defineStore } from "pinia";
import { listGridAssets } from "../api/GridAsset";
import * as assetService from "../services/gridAssetService";
import { useSessionStore } from "./SessionStore";
import type { GridAsset } from "../types/GridAsset";
import type { AssetHealthStatus } from "../types/AssetHealthStatus";

export const useGridAssetStore = defineStore("gridAsset", {
  state: () => ({ rows: [] as GridAsset[], loading: false }),
  getters: {
    feederLines: (state) => [...new Set(state.rows.map((row) => row.feeder_line))],
    byId: (state) => (id: number) => state.rows.find((row) => row.id === id),
    healthCount: (state) => ({
      NORMAL: state.rows.filter((row) => row.health_status === "NORMAL").length,
      WATCH: state.rows.filter((row) => row.health_status === "WATCH").length,
      DEGRADED: state.rows.filter((row) => row.health_status === "DEGRADED").length,
      DANGEROUS: state.rows.filter((row) => row.health_status === "DANGEROUS").length
    })
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listGridAssets();
      this.loading = false;
    },
    historyFaults(assetId: number) {
      return assetService.listAssetFaults(assetId);
    },
    updateHealthStatus(assetId: number, next: AssetHealthStatus) {
      const session = useSessionStore();
      assetService.updateHealthStatus(session.ctx, assetId, next);
      return this.load();
    }
  }
});
