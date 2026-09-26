import type { RepairTicket } from "../types";
export const isActive = (ticket: RepairTicket): boolean => ["ASSIGNED", "ARRIVED", "REPAIRING"].includes(ticket.status);
export const isRestored = (ticket: RepairTicket): boolean => ["RESTORED", "CLOSED"].includes(ticket.status);
