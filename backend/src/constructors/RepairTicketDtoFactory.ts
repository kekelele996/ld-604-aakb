import type { RepairTicket } from "../types";
export const toRepairTicketDto = (row: RepairTicket): RepairTicket => ({ ...row, merged_report_ids: [...row.merged_report_ids] });
export const createDispatchPayload = () => ({ team_id: 0 });
export const createRestorePayload = () => ({ restore_note: "" });
