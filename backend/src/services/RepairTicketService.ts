import { db } from "../repositories/inMemoryDatabase";
import { repairTicketRepository } from "../repositories/RepairTicketRepository";
import { BusinessError } from "../utils/BusinessError";
import { TicketStatusFlow, TicketStatusText, type TicketStatus } from "../constants/TicketStatus";
import { FaultTypeHealthImpact, FaultTypeRequiredSkill } from "../constants/FaultType";
import type { AssetHealthStatus } from "../constants/AssetHealthStatus";
import { appendAuditLog, assertPermission, renderLog, type WriteContext } from "./auditService";
import { gridAssetService } from "./GridAssetService";
import { crewService } from "./CrewService";
import { formatDuration } from "../utils/formatters";
import type { FaultReport, RepairTicket } from "../types";

const StageLabel: Record<string, string> = { ASSIGNED: "派工", ARRIVED: "到场确认", REPAIRING: "开始处理", RESTORED: "复电确认", CLOSED: "归档" };

function ticketNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `GD-${ymd}-${String(++db.seq.ticket).padStart(3, "0")}`;
}

const AdvanceMap: Record<string, { to: TicketStatus; field: keyof RepairTicket; action: string }> = {
  ASSIGNED: { to: "ARRIVED", field: "arrived_at", action: "ticket.advance" },
  ARRIVED: { to: "REPAIRING", field: "repairing_at", action: "ticket.advance" },
  REPAIRING: { to: "RESTORED", field: "restored_at", action: "ticket.restore" },
  RESTORED: { to: "CLOSED", field: "closed_at", action: "ticket.advance" }
};

export const repairTicketService = {
  list(): RepairTicket[] {
    return repairTicketRepository.findAll();
  },
  getById(id: number): RepairTicket {
    const ticket = repairTicketRepository.findById(id);
    if (!ticket) throw new BusinessError("TICKET_NOT_FOUND", { id }, 404);
    return ticket;
  },
  reportsOf(ticket: RepairTicket): FaultReport[] {
    return [ticket.fault_report_id, ...ticket.merged_report_ids]
      .map((id) => db.faultReports.find((row) => row.id === id))
      .filter((row): row is FaultReport => !!row);
  },
  assetsOf(ticket: RepairTicket) {
    const ids = new Set(this.reportsOf(ticket).map((report) => report.asset_id));
    return [...ids].map((id) => gridAssetService.getById(id));
  },
  applyFaultHealthImpact(ctx: WriteContext, assetId: number, faultType: keyof typeof FaultTypeHealthImpact, refNo: string): void {
    const order: AssetHealthStatus[] = ["NORMAL", "WATCH", "DEGRADED", "DANGEROUS"];
    const asset = gridAssetService.getById(assetId);
    const target = FaultTypeHealthImpact[faultType];
    if (order.indexOf(target) > order.indexOf(asset.health_status)) {
      gridAssetService.applyHealth(ctx, asset, target, refNo);
    }
  },
  createFromReport(ctx: WriteContext, primary: FaultReport, mergedIds: number[]): RepairTicket {
    const now = new Date().toISOString();
    const ticket: RepairTicket = {
      id: db.repairTickets.length ? Math.max(...db.repairTickets.map((row) => row.id)) + 1 : 1,
      ticket_no: ticketNo(),
      fault_report_id: primary.id,
      merged_report_ids: mergedIds,
      team_id: null,
      dispatcher_id: 1,
      priority: primary.severity,
      status: "WAIT_DISPATCH",
      assigned_at: null, arrived_at: null, repairing_at: null, restored_at: null, closed_at: null,
      restore_note: null, created_at: now
    };
    repairTicketRepository.save(ticket);
    appendAuditLog(ctx, {
      action: "ticket.create", target_type: "RepairTicket", target_id: ticket.ticket_no,
      detail: renderLog("RepairTicket", "create", { ticket_no: ticket.ticket_no, report_no: primary.report_no, priority: primary.severity })
    });
    return ticket;
  },
  dispatch(ctx: WriteContext, ticketId: number, teamId: number): RepairTicket {
    assertPermission(ctx.role, "ticket:dispatch");
    const ticket = this.getById(ticketId);
    if (ticket.status !== "WAIT_DISPATCH") throw new BusinessError("TICKET_STATUS_ILLEGAL", { no: ticket.ticket_no });
    const crew = crewService.getById(teamId);
    const primary = db.faultReports.find((row) => row.id === ticket.fault_report_id);
    if (!primary) throw new BusinessError("FAULT_NOT_FOUND", { id: ticket.fault_report_id });
    const requiredSkill = FaultTypeRequiredSkill[primary.fault_type];
    const block = crewService.blockReason(crew, requiredSkill);
    if (block) {
      throw block.includes("技能")
        ? new BusinessError("CREW_SKILL_MISMATCH", { name: crew.name, skill: requiredSkill })
        : new BusinessError("CREW_NOT_DISPATCHABLE", { name: crew.name });
    }
    ticket.team_id = crew.id;
    ticket.status = "ASSIGNED";
    ticket.assigned_at = new Date().toISOString();
    crewService.markAssigned(ctx, crew, ticket.ticket_no, ticket.id);
    appendAuditLog(ctx, {
      action: "ticket.dispatch", target_type: "RepairTicket", target_id: ticket.ticket_no,
      detail: renderLog("RepairTicket", "dispatch", { ticket_no: ticket.ticket_no, team_name: crew.name, skill: requiredSkill })
    });
    return ticket;
  },
  advance(ctx: WriteContext, ticketId: number, restoreNote = ""): RepairTicket {
    assertPermission(ctx.role, "ticket:advance");
    const ticket = this.getById(ticketId);
    const step = AdvanceMap[ticket.status];
    if (!step) throw new BusinessError("TICKET_STATUS_ILLEGAL", { no: ticket.ticket_no });
    if (step.to === "RESTORED" && !restoreNote.trim()) throw new BusinessError("VALIDATION_FAILED");
    const from = TicketStatusText[ticket.status];
    const now = new Date().toISOString();
    (ticket[step.field] as string | null) = now;
    ticket.status = step.to;
    if (step.to === "RESTORED") {
      ticket.restore_note = restoreNote.trim();
      assertPermission(ctx.role, "ticket:restore");
    }
    appendAuditLog(ctx, {
      action: step.action, target_type: "RepairTicket", target_id: ticket.ticket_no,
      detail: step.to === "RESTORED"
        ? renderLog("RepairTicket", "restore", { ticket_no: ticket.ticket_no, note: ticket.restore_note ?? "", duration: formatDuration(ticket.assigned_at, ticket.restored_at) })
        : renderLog("RepairTicket", "advance", { ticket_no: ticket.ticket_no, from, to: TicketStatusText[step.to], stage_label: StageLabel[step.to] })
    });
    if (step.to === "RESTORED") {
      // 复电三联动：故障单、资产、班组
      this.reportsOf(ticket).forEach((report) => {
        if (report.merged_into_id === null) {
          report.status = "RESTORED";
          appendAuditLog(ctx, {
            action: "fault.restoreSync", target_type: "FaultReport", target_id: report.report_no,
            detail: renderLog("FaultReport", "restoreSync", { ticket_no: ticket.ticket_no, report_no: report.report_no })
          });
        }
      });
      this.assetsOf(ticket).forEach((asset) => gridAssetService.applyHealth(ctx, asset, "NORMAL", ticket.ticket_no));
      if (ticket.team_id) crewService.release(ctx, crewService.getById(ticket.team_id));
    }
    if (step.to === "CLOSED") {
      this.reportsOf(ticket).forEach((report) => { if (report.status === "RESTORED") report.status = "CLOSED"; });
      appendAuditLog(ctx, {
        action: "ticket.close", target_type: "RepairTicket", target_id: ticket.ticket_no,
        detail: renderLog("RepairTicket", "close", { ticket_no: ticket.ticket_no })
      });
    }
    return ticket;
  },
  nextStage(ticket: RepairTicket): TicketStatus | null {
    const idx = TicketStatusFlow.indexOf(ticket.status);
    return idx >= 0 && idx < TicketStatusFlow.length - 1 ? TicketStatusFlow[idx + 1] : null;
  }
};
