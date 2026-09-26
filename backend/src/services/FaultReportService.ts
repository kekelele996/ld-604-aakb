import { db } from "../repositories/inMemoryDatabase";
import { faultReportRepository } from "../repositories/FaultReportRepository";
import { BusinessError } from "../utils/BusinessError";
import { FaultTypeDefaultSeverity } from "../constants/FaultType";
import { SeverityText } from "../constants/statusText";
import { appendAuditLog, assertPermission, renderLog, type WriteContext } from "./auditService";
import { gridAssetService } from "./GridAssetService";
import { repairTicketService } from "./RepairTicketService";
import type { FaultReport, FaultReportPayload } from "../types";

function reportNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BX-${ymd}-${String(++db.seq.fault).padStart(3, "0")}`;
}

export const faultReportService = {
  list(): FaultReport[] {
    return faultReportRepository.findAll();
  },
  getById(id: number): FaultReport {
    const report = faultReportRepository.findById(id);
    if (!report) throw new BusinessError("FAULT_NOT_FOUND", { id }, 404);
    return report;
  },
  duplicateCandidates(report: FaultReport): FaultReport[] {
    const asset = gridAssetService.getById(report.asset_id);
    return db.faultReports.filter((row) => {
      if (row.id === report.id || row.merged_into_id !== null) return false;
      if (!["PENDING", "TICKETED"].includes(row.status)) return false;
      return gridAssetService.getById(row.asset_id).feeder_line === asset.feeder_line;
    });
  },
  register(ctx: WriteContext, payload: FaultReportPayload): FaultReport {
    assertPermission(ctx.role, "fault:register");
    const assetId = Number(payload.asset_id);
    const reporterName = String(payload.reporter_name ?? "").trim();
    const address = String(payload.address_desc ?? "").trim();
    const faultType = payload.fault_type as FaultReport["fault_type"];
    if (!assetId || !reporterName || !address || !faultType) throw new BusinessError("VALIDATION_FAILED");
    const asset = gridAssetService.getById(assetId);
    const severity = (payload.severity as FaultReport["severity"]) || FaultTypeDefaultSeverity[faultType];
    const now = new Date().toISOString();
    const report: FaultReport = {
      id: db.faultReports.length ? Math.max(...db.faultReports.map((row) => row.id)) + 1 : 1,
      report_no: reportNo(),
      reporter_name: reporterName,
      phone: String(payload.phone ?? ""),
      asset_id: asset.id,
      fault_type: faultType,
      address_desc: address,
      severity,
      report_channel: (payload.report_channel as FaultReport["report_channel"]) || "HOTLINE",
      status: "PENDING",
      affected_users: Math.max(1, Number(payload.affected_users) || 1),
      created_at: now,
      merged_into_id: null,
      ticket_id: null
    };
    faultReportRepository.save(report);
    asset.last_fault_at = now;
    appendAuditLog(ctx, {
      action: "fault.register", target_type: "FaultReport", target_id: report.report_no,
      detail: renderLog("FaultReport", "create", {
        report_no: report.report_no, fault_type: report.fault_type, feeder_line: asset.feeder_line,
        severity: SeverityText[severity], affected_users: report.affected_users
      })
    });
    repairTicketService.applyFaultHealthImpact(ctx, asset.id, faultType, report.report_no);
    return report;
  },
  merge(ctx: WriteContext, sourceId: number, targetId: number): FaultReport {
    assertPermission(ctx.role, "fault:merge");
    if (sourceId === targetId) throw new BusinessError("FAULT_MERGE_SELF");
    const source = this.getById(sourceId);
    const target = this.getById(targetId);
    if (source.merged_into_id || target.merged_into_id) throw new BusinessError("FAULT_MERGE_TARGET_MERGED", { no: target.report_no });
    const sourceAsset = gridAssetService.getById(source.asset_id);
    const targetAsset = gridAssetService.getById(target.asset_id);
    if (sourceAsset.feeder_line !== targetAsset.feeder_line) {
      throw new BusinessError("FAULT_MERGE_DIFFERENT_LINE", { line: targetAsset.feeder_line });
    }
    source.merged_into_id = target.id;
    source.status = "MERGED";
    source.ticket_id = target.ticket_id;
    if (target.ticket_id) {
      const ticket = repairTicketService.getById(target.ticket_id);
      if (!ticket.merged_report_ids.includes(source.id)) ticket.merged_report_ids.push(source.id);
    }
    appendAuditLog(ctx, {
      action: "fault.merge", target_type: "FaultReport", target_id: source.report_no,
      detail: renderLog("FaultReport", "merge", { report_no: source.report_no, target_no: target.report_no, feeder_line: targetAsset.feeder_line })
    });
    return source;
  },
  createTicket(ctx: WriteContext, primaryId: number): { ticket_id: number } {
    assertPermission(ctx.role, "ticket:create");
    const primary = this.getById(primaryId);
    if (primary.merged_into_id) throw new BusinessError("FAULT_MERGE_TARGET_MERGED", { no: primary.report_no });
    if (primary.ticket_id) throw new BusinessError("FAULT_ALREADY_TICKETED", { no: primary.report_no });
    const mergedIds = db.faultReports.filter((row) => row.merged_into_id === primary.id).map((row) => row.id);
    const ticket = repairTicketService.createFromReport(ctx, primary, mergedIds);
    primary.status = "TICKETED";
    primary.ticket_id = ticket.id;
    mergedIds.forEach((id) => { this.getById(id).ticket_id = ticket.id; });
    appendAuditLog(ctx, {
      action: "ticket.create", target_type: "RepairTicket", target_id: ticket.ticket_no,
      detail: renderLog("FaultReport", "createTicket", { report_no: primary.report_no, merged_count: mergedIds.length, ticket_no: ticket.ticket_no })
    });
    return { ticket_id: ticket.id };
  }
};
