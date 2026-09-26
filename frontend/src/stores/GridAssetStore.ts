import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";

/** 资产台账 store：数据来自全局快照；健康度由复电动作联动，无直接写入 */
export const useGridAssetStore = defineStore("gridAsset", {
  getters: {
    rows: () => useDataStore().gridAssets,
    loading: () => useDataStore().loading,
    /** 全部馈线（线路筛选器选项） */
    feederLines(): string[] {
      return [...new Set(useDataStore().gridAssets.map((a) => a.feeder_line))];
    }
  },
  actions: {
    load() {
      return useDataStore().load();
    }
  }
});
