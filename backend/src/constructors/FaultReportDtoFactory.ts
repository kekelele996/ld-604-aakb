import type { FaultReport } from "../types";
export const toFaultReportDto = (row: FaultReport): FaultReport => ({ ...row });
export const createFaultReportPayload = () => ({
  reporter_name: "", phone: "", asset_id: 0, fault_type: "OUTAGE", address_desc: "",
  severity: "", report_channel: "HOTLINE", affected_users: 1
});
