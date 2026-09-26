import { dataStore } from "../repositories/InMemoryStore";
import { faultReportRepository } from "../repositories/FaultReportRepository";
import {
  createFault, mergeFault, generateTicket, findDuplicateFaults, type FaultFormInput
} from "./engine";
import type { FaultReport } from "../models/FaultReport";
import type { CurrentUser } from "../models/Audit";

export const faultReportService = {
  list(): FaultReport[] {
    return faultReportRepository.findAll();
  },

  duplicates(id: number): FaultReport[] {
    return findDuplicateFaults(dataStore.getSnapshot(), id);
  },

  register(form: FaultFormInput, actor: CurrentUser) {
    const next = createFault(dataStore.getSnapshot(), form, actor);
    dataStore.setSnapshot(next);
    return next;
  },

  merge(id: number, masterId: number, actor: CurrentUser) {
    const next = mergeFault(dataStore.getSnapshot(), id, masterId, actor);
    dataStore.setSnapshot(next);
    return next;
  },

  generateTicket(masterFaultId: number, actor: CurrentUser) {
    const next = generateTicket(dataStore.getSnapshot(), masterFaultId, actor);
    dataStore.setSnapshot(next);
    return next;
  }
};
