import { dataStore } from "./InMemoryStore";
import type { RepairTicket } from "../models/RepairTicket";

export const repairTicketRepository = {
  findAll(): RepairTicket[] {
    return dataStore.getSnapshot().tickets;
  },
  findById(id: number): RepairTicket | undefined {
    return dataStore.getSnapshot().tickets.find((t) => t.id === id);
  }
};
