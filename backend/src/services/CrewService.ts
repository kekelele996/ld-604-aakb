import { dataStore } from "../repositories/InMemoryStore";
import { crewRepository } from "../repositories/CrewRepository";
import { toggleCrewDuty } from "./engine";
import type { Crew } from "../models/Crew";
import type { CurrentUser } from "../models/Audit";

export const crewService = {
  list(): Crew[] {
    return crewRepository.findAll();
  },
  toggleDuty(crewId: number, actor: CurrentUser) {
    const next = toggleCrewDuty(dataStore.getSnapshot(), crewId, actor);
    dataStore.setSnapshot(next);
    return next;
  }
};
