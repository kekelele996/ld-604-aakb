import { localDb } from "../mocks/localDb";
import { BusinessError } from "../constants/BusinessError";
import { TicketStatusFlow, TicketStatusText } from "../constants/TicketStatus";
import { FaultTypeHealthImpact, FaultTypeRequiredSkill } from "../constants/FaultType";
import { AssetHealthStatusText, type AssetHealthStatus } from "../types/AssetHealthStatus";
import { writeLog, renderLog, assertPermission, type WriteContext } from "./auditService";
import { getAsset, applyHealthStatus } from "./gridAssetService";
import { getFaultReport, syncReportsRestored } from "./faultReportService";
import { getCrew, dispatchBlock, markCrewAssigned, releaseCrewAfterRestore } from "./crewService";
import { createDefaultRepairTicket } from "../constructors/RepairTicketConstructor";
import { formatDuration } from "../utils/formatters";
import type { RepairTicket } from "../types/RepairTicket";
import type { FaultReport } from "../types/FaultReport";
import type { GridAsset } from "../types/GridAsset";
import type { FaultType } from "../types/FaultType";

const StageLabel: Record<string, string> = {
  ASSIGNED: "派工",
  ARRIVED: "到场确认",
  REPAIRING: "开始处理",
  RESTORED: "复电确认",
  CLOSED: "归档"
};

function nextTicketNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  localDb.seq.ticket += 1;
  return `GD-${ymd}-${String(localDb.seq.ticket).padStart(3, "0")}`;
}

export function listTickets(): RepairTicket[] {
  return localDb.repairTickets;
}

export function getTicket(id: number): RepairTicket {
  const ticket = localDb.repairTickets.find((row) => row.id === id);
  if (!ticket) throw new BusinessError("TICKET_NOT_FOUND", { id });
  return ticket;
}

/** 工单关联的全部报修单（主单 + 合并单），影响户数累加 */
export function getTicketReports(ticket: RepairTicket): FaultReport[] {
  return [ticket.fault_report_id, ...ticket.merged_report_ids]
    .map((id) => localDb.faultReports.find((row) => row.id === id))
    .filter((row): row is FaultReport => !!row);
}

/** 工单关联资产（主单资产 + 合并单资产去重） */
export function getTicketAssets(ticket: RepairTicket): GridAsset[] {
  const ids = new Set(getTicketReports(ticket).map((report) => report.asset_id));
  return [...ids].map((id) => getAsset(id));
}

/** 故障类型冲击资产健康档位（取严：只升不降），登记报修时调用 */
export function applyFaultHealthImpact(ctx: WriteContext, asset: GridAsset, faultType: FaultType, refNo: string): void {
  const order: AssetHealthStatus[] = ["NORMAL", "WATCH", "DEGRADED", "DANGEROUS"];
  const target = FaultTypeHealthImpact[faultType];
  if (order.indexOf(target) > order.indexOf(asset.health_status)) {
    applyHealthStatus(ctx, asset, target, refNo);
  }
}

/** 合并报修单生成工单（由 faultReportService.createTicket 调用） */
export function createTicketFromReport(ctx: WriteContext, primary: FaultReport, mergedIds: number[]): RepairTicket {
  const now = new Date().toISOString();
  const ticket = createDefaultRepairTicket({
    id: ++localDb.seq.ticket,
    ticket_no: nextTicketNo(),
    fault_report_id: primary.id,
    merged_report_ids: mergedIds,
    team_id: null,
    dispatcher_id: 1,
    priority: primary.severity,
    status: "WAIT_DISPATCH",
    created_at: now
  });
  localDb.repairTickets.unshift(ticket);

  writeLog(ctx, {
    action: "ticket.create",
    target_type: "RepairTicket",
    target_id: ticket.ticket_no,
    detail: renderLog("RepairTicket", "create", {
      ticket_no: ticket.ticket_no,
      report_no: primary.report_no,
      priority: primary.severity
    })
  });
  return ticket;
}

/**
 * 派工（调度员）：按班组技能、值班状态和备件……
 * 备件充足性在申请环节校验；派工阶段校验技能匹配 + ON_DUTY + 无在做工单。
 */
export function dispatchTicket(ctx: WriteContext, ticketId: number, teamId: number): RepairTicket {
  assertPermission(ctx.role, "ticket:dispatch");
  const ticket = getTicket(ticketId);
  if (ticket.status !== "WAIT_DISPATCH") throw new BusinessError("TICKET_STATUS_ILLEGAL", { no: ticket.ticket_no });
  const crew = getCrew(teamId);
  const primary = getFaultReport(ticket.fault_report_id);
  const requiredSkill = FaultTypeRequiredSkill[primary.fault_type];
  const block = dispatchBlock(crew, requiredSkill);
  if (block) {
    throw block.code === "CREW_SKILL_MISMATCH"
      ? new BusinessError("CREW_SKILL_MISMATCH", { name: crew.name, skill: requiredSkill })
      : new BusinessError("CREW_NOT_DISPATCHABLE", { name: crew.name });
  }

  const now = new Date().toISOString();
  ticket.team_id = crew.id;
  ticket.status = "ASSIGNED";
  ticket.assigned_at = now;
  markCrewAssigned(ctx, crew, ticket.ticket_no, ticket.id);

  writeLog(ctx, {
    action: "ticket.dispatch",
    target_type: "RepairTicket",
    target_id: ticket.ticket_no,
    detail: renderLog("RepairTicket", "dispatch", {
      ticket_no: ticket.ticket_no,
      team_name: crew.name,
      skill: requiredSkill
    })
  });
  return ticket;
}

/** 工单状态机：班组长按 到场 → 处理 → 复电 → 归档 推进 */
const AdvanceMap: Record<string, { to: RepairTicket["status"]; field: keyof RepairTicket; action: string }> = {
  ASSIGNED: { to: "ARRIVED", field: "arrived_at", action: "ticket.advance" },
  ARRIVED: { to: "REPAIRING", field: "repairing_at", action: "ticket.advance" },
  REPAIRING: { to: "RESTORED", field: "restored_at", action: "ticket.restore" },
  RESTORED: { to: "CLOSED", field: "closed_at", action: "ticket.advance" }
};

export function nextStage(ticket: RepairTicket): RepairTicket["status"] | null {
  const idx = TicketStatusFlow.indexOf(ticket.status);
  return idx >= 0 && idx < TicketStatusFlow.length - 1 ? TicketStatusFlow[idx + 1] : null;
}

/**
 * 推进工单（班组长）。复电确认时：
 * 1) 工单置 RESTORED 并记录结论；2) 主单及合并报修单同步复电；
 * 3) 关联资产健康恢复 NORMAL；4) 班组释放回值班。四处联动一次完成且全部留痕。
 */
export function advanceTicket(ctx: WriteContext, ticketId: number, restoreNote = ""): RepairTicket {
  assertPermission(ctx.role, "ticket:advance");
  const ticket = getTicket(ticketId);
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

  writeLog(ctx, {
    action: step.action,
    target_type: "RepairTicket",
    target_id: ticket.ticket_no,
    detail:
      step.to === "RESTORED"
        ? renderLog("RepairTicket", "restore", {
            ticket_no: ticket.ticket_no,
            note: ticket.restore_note ?? "",
            duration: formatDuration(ticket.assigned_at, ticket.restored_at)
          })
        : renderLog("RepairTicket", "advance", {
            ticket_no: ticket.ticket_no,
            from,
            to: TicketStatusText[step.to],
            stage_label: StageLabel[step.to]
          })
  });

  if (step.to === "RESTORED") {
    // —— 复电三联动：故障单、资产、班组 ——
    syncReportsRestored(ctx, ticket.id, ticket.ticket_no);
    getTicketAssets(ticket).forEach((asset) => {
      applyHealthStatus(ctx, asset, "NORMAL", ticket.ticket_no);
    });
    if (ticket.team_id) releaseCrewAfterRestore(ctx, getCrew(ticket.team_id));
  }

  if (step.to === "CLOSED") {
    getTicketReports(ticket).forEach((report) => {
      if (report.status === "RESTORED") report.status = "CLOSED";
    });
    writeLog(ctx, {
      action: "ticket.close",
      target_type: "RepairTicket",
      target_id: ticket.ticket_no,
      detail: renderLog("RepairTicket", "close", { ticket_no: ticket.ticket_no })
    });
  }
  return ticket;
}

export const ticketStageLabel = StageLabel;
export const assetHealthText = AssetHealthStatusText;
