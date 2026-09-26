import { dataStore } from "../repositories/InMemoryStore";
import { repairTicketRepository } from "../repositories/RepairTicketRepository";
import {
  dispatchTicket, arriveTicket, progressTicket, restoreTicket, closeTicket
} from "./engine";
import type { RepairTicket } from "../models/RepairTicket";
import type { CurrentUser } from "../models/Audit";
import type { Priority } from "../constants/Role";

export const repairTicketService = {
  list(): RepairTicket[] {
    return repairTicketRepository.findAll();
  },

  dispatch(ticketId: number, teamId: number, priority: Priority, actor: CurrentUser) {
    const next = dispatchTicket(dataStore.getSnapshot(), ticketId, teamId, priority, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  arrive(ticketId: number, actor: CurrentUser) {
    const next = arriveTicket(dataStore.getSnapshot(), ticketId, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  progress(ticketId: number, actor: CurrentUser) {
    const next = progressTicket(dataStore.getSnapshot(), ticketId, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  restore(ticketId: number, remark: string, actor: CurrentUser) {
    const next = restoreTicket(dataStore.getSnapshot(), ticketId, remark, actor);
    dataStore.setSnapshot(next);
    return next;
  },
  close(ticketId: number, actor: CurrentUser) {
    const next = closeTicket(dataStore.getSnapshot(), ticketId, actor);
    dataStore.setSnapshot(next);
    return next;
  }
};
