import type { FaultReport } from "../types/FaultReport";
import { FaultType } from "../constants/FaultType";
import { Severity } from "../constants/Severity";
import { ReportChannel } from "../constants/ReportChannel";
import { FaultStatus } from "../constants/FaultStatus";

export const createDefaultFaultReport = (overrides: Partial<FaultReport> = {}): FaultReport => ({
  id: 0,
  reporter_name: "",
  phone: "",
  asset_id: 0,
  fault_type: FaultType.OUTAGE,
  address_desc: "",
  severity: Severity.NORMAL,
  report_channel: ReportChannel.HOTLINE,
  status: FaultStatus.PENDING,
  merged_into_id: null,
  ticket_id: null,
  created_at: new Date().toISOString(),
  ...overrides
});

/** 登记报修表单（FaultsPage 弹窗） */
export const createFaultReportForm = (): Omit<FaultReport, "id" | "status" | "merged_into_id" | "ticket_id" | "created_at"> => ({
  reporter_name: "",
  phone: "",
  asset_id: 0,
  fault_type: FaultType.OUTAGE,
  address_desc: "",
  severity: Severity.NORMAL,
  report_channel: ReportChannel.HOTLINE
});

export type FaultReportForm = ReturnType<typeof createFaultReportForm>;

export const createFaultReportResponse = (row: FaultReport): FaultReport =>
  createDefaultFaultReport(row);
