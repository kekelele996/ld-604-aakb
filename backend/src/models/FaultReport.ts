import type { FaultReport } from "../types";
export const isPrimary = (report: FaultReport): boolean => report.merged_into_id === null;
export const isOpen = (report: FaultReport): boolean => ["PENDING", "TICKETED"].includes(report.status);
