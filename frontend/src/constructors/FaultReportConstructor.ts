import type { FaultReport } from "../types/FaultReport";

export const createDefaultFaultReport = (overrides: Partial<FaultReport> = {}): FaultReport => ({
  id: 0,
  report_no: "",
  reporter_name: "",
  phone: "",
  asset_id: 0,
  fault_type: "OUTAGE",
  address_desc: "",
  severity: "NORMAL",
  report_channel: "HOTLINE",
  status: "PENDING",
  affected_users: 1,
  created_at: "",
  merged_into_id: null,
  ticket_id: null,
  ...overrides
});

/** 登记报修表单（severity 留空时由 service 按故障类型自动分级） */
export interface FaultReportForm {
  reporter_name: string;
  phone: string;
  asset_id: number | null;
  fault_type: FaultReport["fault_type"];
  address_desc: string;
  severity: FaultReport["severity"] | "";
  report_channel: FaultReport["report_channel"];
  affected_users: number;
}

export const createFaultReportForm = (): FaultReportForm => ({
  reporter_name: "",
  phone: "",
  asset_id: null,
  fault_type: "OUTAGE",
  address_desc: "",
  severity: "",
  report_channel: "HOTLINE",
  affected_users: 1
});

export const createFaultReportResponse = (row: FaultReport) => ({ ...row });
