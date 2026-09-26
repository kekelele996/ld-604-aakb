import { localDb } from "../mocks/localDb";
import type { RepairTicket } from "../types/RepairTicket";

export async function listRepairTickets(): Promise<RepairTicket[]> {
  return localDb.repairTickets.map((row) => ({ ...row, merged_report_ids: [...row.merged_report_ids] }));
}
