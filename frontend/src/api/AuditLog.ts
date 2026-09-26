import { localDb } from "../mocks/localDb";
import type { AuditLog } from "../types/AuditLog";

export async function listAuditLogs(): Promise<AuditLog[]> {
  return localDb.auditLogs.map((row) => ({ ...row }));
}
