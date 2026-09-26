import type { FaultReport } from "../models/FaultReport";
import { FaultType } from "../constants/FaultType";
import { Severity, FaultStatus } from "../constants/Role";

export const createFaultReportDto = (body: Partial<FaultReport> = {}): FaultReport => ({
  id: body.id ?? 0,
  reporter_name: body.reporter_name ?? "",
  phone: body.phone ?? "",
  asset_id: body.asset_id ?? 0,
  fault_type: body.fault_type ?? FaultType.OUTAGE,
  address_desc: body.address_desc ?? "",
  severity: body.severity ?? Severity.NORMAL,
  report_channel: body.report_channel ?? "HOTLINE",
  status: body.status ?? FaultStatus.PENDING,
  merged_into_id: body.merged_into_id ?? null,
  ticket_id: body.ticket_id ?? null,
  created_at: body.created_at ?? new Date().toISOString()
});

export const toFaultReportResponse = (row: FaultReport): FaultReport => ({ ...row });
