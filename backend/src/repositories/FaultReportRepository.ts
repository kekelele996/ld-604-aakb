import { dataStore } from "./InMemoryStore";
import type { FaultReport } from "../models/FaultReport";

export const faultReportRepository = {
  findAll(): FaultReport[] {
    return dataStore.getSnapshot().faults;
  },
  findById(id: number): FaultReport | undefined {
    return dataStore.getSnapshot().faults.find((f) => f.id === id);
  }
};
