import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";
import { useAuthStore } from "./authStore";
import { toggleCrewDuty } from "../api/Crew";
import { runAction } from "../hooks/runAction";

export const useCrewStore = defineStore("crew", {
  getters: {
    rows: () => useDataStore().crews
  },
  actions: {
    load() {
      return useDataStore().load();
    },
    toggleDuty(crewId: number) {
      const auth = useAuthStore();
      return runAction((actor) => toggleCrewDuty(crewId, actor), `班组值班状态已切换（${auth.user.name}）`);
    }
  }
});
