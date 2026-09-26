import { db } from "./inMemoryDatabase";
import type { RepairTicket } from "../types";

export const repairTicketRepository = {
  findAll: (): RepairTicket[] => db.repairTickets,
  findById: (id: number): RepairTicket | undefined => db.repairTickets.find((row) => row.id === id),
  save: (row: RepairTicket): RepairTicket => {
    const index = db.repairTickets.findIndex((item) => item.id === row.id);
    if (index >= 0) db.repairTickets[index] = row; else db.repairTickets.unshift(row);
    return row;
  }
};
