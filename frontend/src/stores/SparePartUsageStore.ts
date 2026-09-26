import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";
import {
  applySparePart,
  approveSparePart,
  rejectSparePart,
  consumeSparePart,
  returnSparePart,
  adjustStock
} from "../api/SparePartUsage";
import { runAction } from "../hooks/runAction";

export const useSparePartUsageStore = defineStore("sparePartUsage", {
  getters: {
    rows: () => useDataStore().parts,
    stocks: () => useDataStore().stocks,
    txns: () => useDataStore().stockTxns,
    pendingApprovals(): import("../types/SparePartUsage").SparePartUsage[] {
      return useDataStore().parts.filter((p) => p.usage_status === "PENDING");
    }
  },
  actions: {
    load() {
      return useDataStore().load();
    },
    /** 班组长申请（不扣库存） */
    apply(ticketId: number, partCode: string, quantity: number) {
      return runAction((actor) => applySparePart(ticketId, partCode, quantity, actor), "备件申请已提交，等待仓管审批");
    },
    /** 仓管批准 —— 此刻才扣库存 */
    approve(usageId: number) {
      return runAction((actor) => approveSparePart(usageId, actor), "已批准并扣减库存");
    },
    reject(usageId: number, reason: string) {
      return runAction((actor) => rejectSparePart(usageId, reason, actor), "申请已驳回，库存未变动");
    },
    consume(usageId: number) {
      return runAction((actor) => consumeSparePart(usageId, actor), "已登记消耗");
    },
    returnPart(usageId: number) {
      return runAction((actor) => returnSparePart(usageId, actor), "备件已归还，库存回补");
    },
    stockAdjust(partCode: string, newStock: number) {
      return runAction((actor) => adjustStock(partCode, newStock, actor), "库存盘点完成");
    }
  }
});
