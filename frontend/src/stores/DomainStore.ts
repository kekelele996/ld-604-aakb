import { defineStore } from "pinia";
import { resetLocalDatabase } from "../mocks/localDb";
import { useGridAssetStore } from "./GridAssetStore";
import { useFaultReportStore } from "./FaultReportStore";
import { useRepairTicketStore } from "./RepairTicketStore";
import { useCrewStore } from "./CrewStore";
import { useSparePartUsageStore } from "./SparePartUsageStore";
import { useAuditLogStore } from "./AuditLogStore";

/**
 * 统一领域 store：跨实体联查与写后刷新。
 * 任一写操作（登记/合并/派工/流转/审批）后调用 reloadAll，
 * 保证态势、资产、报修、工单、备件五页数据一致。
 */
export const useDomainStore = defineStore("domain", {
  actions: {
    async loadAll() {
      await Promise.all([
        useGridAssetStore().load(),
        useFaultReportStore().load(),
        useRepairTicketStore().load(),
        useCrewStore().load(),
        useSparePartUsageStore().load(),
        useAuditLogStore().load()
      ]);
    },
    /** 写操作后刷新：service 直接改 localDb，store 重新拉取即可联动 */
    async reloadAll() {
      await this.loadAll();
    },
    async resetAll() {
      resetLocalDatabase();
      await this.loadAll();
    }
  }
});
