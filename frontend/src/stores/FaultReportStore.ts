import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";
import {
  createFaultReport,
  mergeFaultReport,
  generateTicketFromFault,
  type FaultFormInput
} from "../api/FaultReport";
import { runAction } from "../hooks/runAction";

export const useFaultReportStore = defineStore("faultReport", {
  getters: {
    rows: () => useDataStore().faults,
    pendingRows(): import("../types/FaultReport").FaultReport[] {
      return useDataStore().faults.filter((f) => f.status === "PENDING");
    }
  },
  actions: {
    load() {
      return useDataStore().load();
    },
    /** 登记报修 */
    register(form: FaultFormInput) {
      return runAction((actor) => createFaultReport(form, actor), "报修登记成功");
    },
    /** 同线路重复报修合并 */
    merge(id: number, masterId: number) {
      return runAction((actor) => mergeFaultReport(id, masterId, actor), `报修 #${id} 已并入 #${masterId}`);
    },
    /** 生成工单 */
    generateTicket(masterFaultId: number) {
      return runAction((actor) => generateTicketFromFault(masterFaultId, actor), "已生成抢修工单");
    }
  }
});
