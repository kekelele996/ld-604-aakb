import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";
import {
  dispatchTicket,
  arriveTicket,
  progressTicket,
  restoreTicket,
  closeTicket
} from "../api/RepairTicket";
import { runAction } from "../hooks/runAction";
import type { Priority } from "../constants/Priority";

export const useRepairTicketStore = defineStore("repairTicket", {
  getters: {
    rows: () => useDataStore().tickets,
    waitDispatch(): import("../types/RepairTicket").RepairTicket[] {
      return useDataStore().tickets.filter((t) => t.status === "WAIT_DISPATCH");
    },
    active(): import("../types/RepairTicket").RepairTicket[] {
      return useDataStore().tickets.filter((t) => !["RESTORED", "CLOSED"].includes(t.status));
    }
  },
  actions: {
    load() {
      return useDataStore().load();
    },
    dispatch(ticketId: number, teamId: number, priority: Priority) {
      return runAction((actor) => dispatchTicket(ticketId, teamId, priority, actor), "派工成功，班组已接单");
    },
    arrive(ticketId: number) {
      return runAction((actor) => arriveTicket(ticketId, actor), "已确认到场");
    },
    startRepair(ticketId: number) {
      return runAction((actor) => progressTicket(ticketId, actor), "已开始现场处理");
    },
    restore(ticketId: number, remark: string) {
      return runAction((actor) => restoreTicket(ticketId, remark, actor), "复电成功，故障与资产状态已同步更新");
    },
    close(ticketId: number) {
      return runAction((actor) => closeTicket(ticketId, actor), "工单已归档");
    }
  }
});
