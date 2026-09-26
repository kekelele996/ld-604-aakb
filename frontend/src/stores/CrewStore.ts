import { defineStore } from "pinia";
import { listCrews } from "../api/Crew";
import * as crewService from "../services/crewService";
import { useSessionStore } from "./SessionStore";
import type { Crew } from "../types/Crew";

export const useCrewStore = defineStore("crew", {
  state: () => ({ rows: [] as Crew[], loading: false }),
  getters: {
    byId: (state) => (id: number | null | undefined) => state.rows.find((row) => row.id === id),
    onDutyCount: (state) => state.rows.filter((row) => row.duty_status === "ON_DUTY").length,
    /** 可派工校验原因（技能 + 值班 + 在做工单），派工弹窗与 CrewCard 共用 */
    blockReason: () => (crew: Crew, requiredSkill: string) => crewService.dispatchBlockReason(crew, requiredSkill)
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listCrews();
      this.loading = false;
    },
    toggleDuty(crewId: number) {
      const session = useSessionStore();
      return crewService.toggleDutyStatus(session.ctx, crewId);
    }
  }
});
