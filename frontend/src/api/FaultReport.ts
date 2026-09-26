import { localDb } from "../mocks/localDb";
import type { FaultReport } from "../types/FaultReport";

export async function listFaultReports(): Promise<FaultReport[]> {
  return localDb.faultReports.map((row) => ({ ...row }));
}
