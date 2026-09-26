import type { FaultType } from "../constants/FaultType";
import type { Severity } from "../constants/Role";

/** 登记报修请求体（controller 校验后传给 service） */
export interface FaultReportPayload {
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: FaultType;
  address_desc: string;
  severity: Severity;
  report_channel: string;
}

export type MergeFaultPayload = { id: number; masterId: number };
export type GenerateTicketPayload = { masterFaultId: number };
