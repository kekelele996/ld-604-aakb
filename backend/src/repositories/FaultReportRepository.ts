import { db } from "./inMemoryDatabase";
import type { FaultReport } from "../types";

export const faultReportRepository = {
  findAll: (): FaultReport[] => db.faultReports,
  findById: (id: number): FaultReport | undefined => db.faultReports.find((row) => row.id === id),
  save: (row: FaultReport): FaultReport => {
    const index = db.faultReports.findIndex((item) => item.id === row.id);
    if (index >= 0) db.faultReports[index] = row; else db.faultReports.unshift(row);
    return row;
  }
};
