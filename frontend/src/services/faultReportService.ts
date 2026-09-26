import { localDb } from "../mocks/localDb";
import { BusinessError } from "../constants/BusinessError";
import { FaultTypeDefaultSeverity } from "../constants/FaultType";
import { SeverityText } from "../constants/FaultStatus";
import { writeLog, renderLog, assertPermission, type WriteContext } from "./auditService";
import { getAsset } from "./gridAssetService";
import { createDefaultFaultReport, type FaultReportForm } from "../constructors/FaultReportConstructor";
import { createTicketFromReport } from "./repairTicketService";
import { applyFaultHealthImpact } from "./repairTicketService";
import type { FaultReport } from "../types/FaultReport";

function nextReportNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  localDb.seq.fault += 1;
  return `BX-${ymd}-${String(localDb.seq.fault).padStart(3, "0")}`;
}

export function listFaultReports(): FaultReport[] {
  return localDb.faultReports;
}

export function getFaultReport(id: number): FaultReport {
  const report = localDb.faultReports.find((row) => row.id === id);
  if (!report) throw new BusinessError("FAULT_NOT_FOUND", { id });
  return report;
}

/**
 * 登记报修（调度员）。
 * - severity 未选择时按 FaultType 默认分级（枚举常量单一来源）；
 * - 登记即按故障类型冲击资产健康档位（取严）；
 * - 同线路已有未结主单时给出重复提示，是否合并由调度员确认。
 */
export function registerFaultReport(ctx: WriteContext, form: FaultReportForm): FaultReport {
  assertPermission(ctx.role, "fault:register");
  if (!form.asset_id) throw new BusinessError("VALIDATION_FAILED");
  if (!form.reporter_name.trim() || !form.address_desc.trim()) throw new BusinessError("VALIDATION_FAILED");
  const asset = getAsset(form.asset_id);
  const severity = form.severity || FaultTypeDefaultSeverity[form.fault_type];
  const now = new Date().toISOString();
  const report = createDefaultFaultReport({
    id: ++localDb.seq.fault,
    report_no: nextReportNo(),
    reporter_name: form.reporter_name.trim(),
    phone: form.phone,
    asset_id: asset.id,
    fault_type: form.fault_type,
    address_desc: form.address_desc.trim(),
    severity,
    report_channel: form.report_channel,
    affected_users: Math.max(1, Number(form.affected_users) || 1),
    status: "PENDING",
    created_at: now
  });
  localDb.faultReports.unshift(report);
  asset.last_fault_at = now;

  writeLog(ctx, {
    action: "fault.register",
    target_type: "FaultReport",
    target_id: report.report_no,
    detail: renderLog("FaultReport", "create", {
      report_no: report.report_no,
      fault_type: form.fault_type,
      feeder_line: asset.feeder_line,
      severity: SeverityText[severity],
      affected_users: report.affected_users
    })
  });

  // 登记即冲击资产健康（取严），与复电恢复共用同一联动入口
  applyFaultHealthImpact(ctx, asset, form.fault_type, report.report_no);
  return report;
}

/** 同线路 + 未结（PENDING/TICKETED 且未复电）主单，作为可合并候选 */
export function findDuplicateCandidates(report: FaultReport): FaultReport[] {
  const asset = getAsset(report.asset_id);
  return localDb.faultReports.filter((row) => {
    if (row.id === report.id || row.merged_into_id !== null) return false;
    if (!["PENDING", "TICKETED"].includes(row.status)) return false;
    const target = localDb.gridAssets.find((a) => a.id === row.asset_id);
    return target?.feeder_line === asset.feeder_line;
  });
}

/**
 * 合并重复报修（调度员）：仅允许合并到同线路、且自身不是重复单的主单。
 * - 主单尚未生成工单：合并单等主单一起生成；
 * - 主单已有工单：合并单直接并入该工单，工单累计影响户数。
 */
export function mergeFaultReport(ctx: WriteContext, sourceId: number, targetId: number): FaultReport {
  assertPermission(ctx.role, "fault:merge");
  if (sourceId === targetId) throw new BusinessError("FAULT_MERGE_SELF");
  const source = getFaultReport(sourceId);
  const target = getFaultReport(targetId);
  if (source.merged_into_id) throw new BusinessError("FAULT_MERGE_TARGET_MERGED", { no: source.report_no });
  if (target.merged_into_id) throw new BusinessError("FAULT_MERGE_TARGET_MERGED", { no: target.report_no });
  const sourceAsset = getAsset(source.asset_id);
  const targetAsset = getAsset(target.asset_id);
  if (sourceAsset.feeder_line !== targetAsset.feeder_line) {
    throw new BusinessError("FAULT_MERGE_DIFFERENT_LINE", { line: targetAsset.feeder_line });
  }

  source.merged_into_id = target.id;
  source.status = "MERGED";
  source.ticket_id = target.ticket_id;
  if (target.ticket_id) {
    const ticket = localDb.repairTickets.find((row) => row.id === target.ticket_id);
    if (ticket && !ticket.merged_report_ids.includes(source.id)) ticket.merged_report_ids.push(source.id);
  }

  writeLog(ctx, {
    action: "fault.merge",
    target_type: "FaultReport",
    target_id: source.report_no,
    detail: renderLog("FaultReport", "merge", {
      report_no: source.report_no,
      target_no: target.report_no,
      feeder_line: targetAsset.feeder_line
    })
  });
  return source;
}

/** 同线路重复报修合并后生成工单（主单 + 其全部重复单） */
export function createTicket(ctx: WriteContext, primaryReportId: number): { ticket_id: number } {
  assertPermission(ctx.role, "ticket:create");
  const primary = getFaultReport(primaryReportId);
  if (primary.merged_into_id) throw new BusinessError("FAULT_MERGE_TARGET_MERGED", { no: primary.report_no });
  if (primary.ticket_id) throw new BusinessError("FAULT_ALREADY_TICKETED", { no: primary.report_no });

  const mergedIds = localDb.faultReports.filter((row) => row.merged_into_id === primary.id).map((row) => row.id);
  const ticket = createTicketFromReport(ctx, primary, mergedIds);

  primary.status = "TICKETED";
  primary.ticket_id = ticket.id;
  mergedIds.forEach((id) => {
    const dup = getFaultReport(id);
    dup.ticket_id = ticket.id;
  });

  writeLog(ctx, {
    action: "ticket.create",
    target_type: "RepairTicket",
    target_id: ticket.ticket_no,
    detail: renderLog("FaultReport", "createTicket", {
      report_no: primary.report_no,
      merged_count: mergedIds.length,
      ticket_no: ticket.ticket_no
    })
  });
  return { ticket_id: ticket.id };
}

/** 复电/归档时由工单服务回调：同步主单与合并单状态 */
export function syncReportsRestored(ctx: WriteContext, ticketId: number, ticketNo: string): void {
  const ticket = localDb.repairTickets.find((row) => row.id === ticketId);
  if (!ticket) return;
  const ids = [ticket.fault_report_id, ...ticket.merged_report_ids];
  ids.forEach((id) => {
    const report = localDb.faultReports.find((row) => row.id === id);
    // 仅主单同步为已复电；合并单保持 MERGED 状态（其状态从属于主单）
    if (report && report.merged_into_id === null && report.status !== "RESTORED") {
      report.status = "RESTORED";
      writeLog(ctx, {
        action: "fault.restoreSync",
        target_type: "FaultReport",
        target_id: report.report_no,
        detail: renderLog("FaultReport", "restoreSync", { ticket_no: ticketNo, report_no: report.report_no })
      });
    }
  });
}
