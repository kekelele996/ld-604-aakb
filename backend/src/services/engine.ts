import type { Snapshot, CurrentUser } from "../models/Audit";
import type { FaultReport } from "../models/FaultReport";
import type { RepairTicket } from "../models/RepairTicket";
import { BusinessError } from "../constants/errorMessages";
import { ERROR_CODES } from "../constants/errorCodes";
import { TicketStatus, TICKET_STATUS_FLOW } from "../constants/TicketStatus";
import {
  CrewDutyStatus, PartStatus, FaultStatus, Severity, Priority,
  type Priority as PriorityType, type PartStatus as PStatus
} from "../constants/Role";
import { AssetHealthStatus } from "../constants/AssetHealthStatus";
import { LogAction, renderLog } from "../constants/logTemplates";

/**
 * 后端业务引擎 —— 与 frontend/src/api/engine.ts 规则一致。
 * service 层按实体拆分后都调用这里，保证单一规则来源（生产可改为 Prisma 事务）。
 */

type Actor = CurrentUser;
const clone = (s: Snapshot): Snapshot => structuredClone(s);
const now = () => new Date().toISOString();
const nextId = <T extends { id: number }>(rows: T[]): number =>
  rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

function pushLog(
  s: Snapshot,
  actor: Actor,
  entity: "GridAsset" | "FaultReport" | "RepairTicket" | "Crew" | "SparePart",
  action: string,
  params: Record<string, string | number>,
  targetType: string,
  targetId: number | string
): void {
  s.auditLogs.unshift({
    id: nextId(s.auditLogs),
    actor: actor.name,
    actor_role: actor.role,
    action: renderLog(entity, action, params),
    target_type: targetType,
    target_id: targetId,
    created_at: now()
  });
}

const getFault = (s: Snapshot, id: number): FaultReport => {
  const row = s.faults.find((f) => f.id === id);
  if (!row) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "故障报修", id });
  return row;
};

const getTicket = (s: Snapshot, id: number): RepairTicket => {
  const row = s.tickets.find((t) => t.id === id);
  if (!row) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "抢修工单", id });
  return row;
};

export interface FaultFormInput {
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: FaultReport["fault_type"];
  address_desc: string;
  severity: FaultReport["severity"];
  report_channel: string;
}

export const createFault = (s: Snapshot, form: FaultFormInput, actor: Actor): Snapshot => {
  const next = clone(s);
  if (!form.reporter_name?.trim() || !form.asset_id || !form.address_desc?.trim()) {
    throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "报修人/关联资产/故障描述" });
  }
  if (!next.gridAssets.some((a) => a.id === form.asset_id)) {
    throw new BusinessError(ERROR_CODES.ASSET_NOT_FOUND, { id: form.asset_id });
  }
  const row: FaultReport = {
    id: nextId(next.faults),
    reporter_name: form.reporter_name,
    phone: form.phone,
    asset_id: form.asset_id,
    fault_type: form.fault_type,
    address_desc: form.address_desc,
    severity: form.severity,
    report_channel: form.report_channel,
    status: FaultStatus.PENDING,
    merged_into_id: null,
    ticket_id: null,
    created_at: now()
  };
  next.faults.unshift(row);
  pushLog(next, actor, "FaultReport", LogAction.CREATE, {
    id: row.id, reporterName: row.reporter_name, faultType: row.fault_type, severity: row.severity
  }, "FaultReport", row.id);
  return next;
};

export const findDuplicateFaults = (s: Snapshot, faultId: number): FaultReport[] => {
  const target = getFault(s, faultId);
  const line = s.gridAssets.find((a) => a.id === target.asset_id)?.feeder_line;
  return s.faults.filter(
    (f) =>
      f.id !== faultId &&
      f.status !== FaultStatus.MERGED &&
      f.status !== FaultStatus.RESOLVED &&
      f.merged_into_id === null &&
      s.gridAssets.find((a) => a.id === f.asset_id)?.feeder_line === line
  );
};

export const mergeFault = (s: Snapshot, id: number, masterId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const child = getFault(next, id);
  const master = getFault(next, masterId);
  if (child.status === FaultStatus.MERGED) throw new BusinessError(ERROR_CODES.DUPLICATE_MERGE, { id });
  if (child.id === master.id) throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "主报修不能是自己" });
  const childLine = next.gridAssets.find((a) => a.id === child.asset_id)?.feeder_line;
  const masterLine = next.gridAssets.find((a) => a.id === master.asset_id)?.feeder_line;
  if (childLine !== masterLine) throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "仅同线路报修可合并" });
  child.status = FaultStatus.MERGED;
  child.merged_into_id = master.id;
  child.ticket_id = master.ticket_id;
  if (master.ticket_id) {
    const ticket = next.tickets.find((t) => t.id === master.ticket_id);
    if (ticket && !ticket.merged_report_ids.includes(child.id)) ticket.merged_report_ids.push(child.id);
  }
  pushLog(next, actor, "FaultReport", LogAction.MERGE, { id: child.id, masterId: master.id }, "FaultReport", child.id);
  return next;
};

const severityRank: Record<Severity, number> = { NORMAL: 0, URGENT: 1, CRITICAL: 2 };
const severityToPriority: Record<Severity, PriorityType> = {
  NORMAL: Priority.MEDIUM, URGENT: Priority.HIGH, CRITICAL: Priority.URGENT
};

export const generateTicket = (s: Snapshot, masterFaultId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const master = getFault(next, masterFaultId);
  if (master.status !== FaultStatus.PENDING) {
    throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "仅待处理报修可生成工单" });
  }
  const reportIds = [master.id, ...next.faults.filter((f) => f.merged_into_id === master.id).map((f) => f.id)];
  const reports = reportIds.map((id) => getFault(next, id));
  const topSeverity = reports.reduce<Severity>(
    (acc, f) => (severityRank[f.severity] > severityRank[acc] ? f.severity : acc),
    Severity.NORMAL
  );
  const ticket: RepairTicket = {
    id: nextId(next.tickets),
    fault_report_id: master.id,
    merged_report_ids: reportIds,
    team_id: null,
    dispatcher_id: actor.id,
    priority: severityToPriority[topSeverity],
    status: TicketStatus.WAIT_DISPATCH,
    assigned_at: null,
    arrived_at: null,
    repairing_at: null,
    restored_at: null,
    closed_at: null,
    created_at: now(),
    restore_remark: null
  };
  next.tickets.unshift(ticket);
  reports.forEach((f) => {
    f.status = FaultStatus.TICKETED;
    f.ticket_id = ticket.id;
  });
  pushLog(next, actor, "FaultReport", LogAction.GENERATE, {
    id: master.id, mergedCount: reportIds.length - 1, ticketId: ticket.id
  }, "FaultReport", master.id);
  return next;
};

export const dispatchTicket = (
  s: Snapshot,
  ticketId: number,
  teamId: number,
  priority: PriorityType,
  actor: Actor
): Snapshot => {
  const next = clone(s);
  const ticket = getTicket(next, ticketId);
  if (ticket.status !== TicketStatus.WAIT_DISPATCH) {
    throw new BusinessError(ERROR_CODES.INVALID_TRANSITION, { id: ticketId, from: ticket.status, to: TicketStatus.ASSIGNED });
  }
  const crew = next.crews.find((c) => c.id === teamId);
  if (!crew) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "抢修班组", id: teamId });
  if (crew.duty_status === CrewDutyStatus.OFF_DUTY || crew.current_ticket_id !== null) {
    throw new BusinessError(ERROR_CODES.NO_AVAILABLE_CREW, { skill: "值班待命" });
  }
  const master = getFault(next, ticket.fault_report_id);
  const skill = next.gridAssets.find((a) => a.id === master.asset_id)?.asset_type ?? "";
  if (skill && !crew.skill_tags.split(",").map((t) => t.trim()).includes(skill)) {
    throw new BusinessError(ERROR_CODES.NO_AVAILABLE_CREW, { skill });
  }
  ticket.team_id = crew.id;
  ticket.priority = priority;
  ticket.status = TicketStatus.ASSIGNED;
  ticket.assigned_at = now();
  crew.duty_status = CrewDutyStatus.BUSY;
  crew.current_ticket_id = ticket.id;
  pushLog(next, actor, "RepairTicket", LogAction.DISPATCH, { id: ticket.id, teamName: crew.name, dispatcher: actor.name }, "RepairTicket", ticket.id);
  pushLog(next, actor, "Crew", LogAction.ASSIGN, { name: crew.name, ticketId: ticket.id }, "Crew", crew.id);
  return next;
};

const advance = (
  s: Snapshot,
  ticketId: number,
  target: TicketStatus,
  actor: Actor,
  stamp: keyof RepairTicket
): Snapshot => {
  const next = clone(s);
  const ticket = getTicket(next, ticketId);
  const expected = TICKET_STATUS_FLOW[TICKET_STATUS_FLOW.indexOf(target) - 1];
  if (ticket.status !== expected) {
    throw new BusinessError(ERROR_CODES.INVALID_TRANSITION, { id: ticketId, from: ticket.status, to: target });
  }
  const from = ticket.status;
  ticket.status = target;
  (ticket[stamp] as string | null) = now();
  pushLog(next, actor, "RepairTicket", LogAction.STATUS_CHANGE, { id: ticket.id, from, to: target, operator: actor.name }, "RepairTicket", ticket.id);
  return next;
};

export const arriveTicket = (s: Snapshot, ticketId: number, actor: Actor): Snapshot =>
  advance(s, ticketId, TicketStatus.ARRIVED, actor, "arrived_at");
export const progressTicket = (s: Snapshot, ticketId: number, actor: Actor): Snapshot =>
  advance(s, ticketId, TicketStatus.REPAIRING, actor, "repairing_at");

export const restoreTicket = (s: Snapshot, ticketId: number, remark: string, actor: Actor): Snapshot => {
  const next = clone(s);
  const ticket = getTicket(next, ticketId);
  if (ticket.status !== TicketStatus.REPAIRING) {
    throw new BusinessError(ERROR_CODES.INVALID_TRANSITION, { id: ticketId, from: ticket.status, to: TicketStatus.RESTORED });
  }
  const from = ticket.status;
  ticket.status = TicketStatus.RESTORED;
  ticket.restored_at = now();
  ticket.restore_remark = remark || "现场处置完毕，恢复供电";
  const assetIds = new Set<number>();
  ticket.merged_report_ids.forEach((fid) => {
    const f = next.faults.find((row) => row.id === fid);
    if (f) {
      f.status = FaultStatus.RESOLVED;
      assetIds.add(f.asset_id);
    }
  });
  assetIds.forEach((aid) => {
    const asset = next.gridAssets.find((a) => a.id === aid);
    if (asset && asset.health_status !== AssetHealthStatus.NORMAL) {
      const oldStatus = asset.health_status;
      asset.health_status = AssetHealthStatus.NORMAL;
      pushLog(next, actor, "GridAsset", LogAction.STATUS_CHANGE, { assetCode: asset.asset_code, from: oldStatus, to: AssetHealthStatus.NORMAL }, "GridAsset", asset.id);
    }
  });
  const crew = next.crews.find((c) => c.id === ticket.team_id);
  if (crew) {
    crew.duty_status = CrewDutyStatus.ON_DUTY;
    crew.current_ticket_id = null;
  }
  pushLog(next, actor, "RepairTicket", LogAction.STATUS_CHANGE, { id: ticket.id, from, to: TicketStatus.RESTORED, operator: actor.name }, "RepairTicket", ticket.id);
  const assetCode = next.gridAssets.find((a) => a.id === getFault(next, ticket.fault_report_id).asset_id)?.asset_code ?? "-";
  pushLog(next, actor, "RepairTicket", LogAction.RESTORE, { id: ticket.id, assetCode }, "RepairTicket", ticket.id);
  return next;
};

export const closeTicket = (s: Snapshot, ticketId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const ticket = getTicket(next, ticketId);
  if (ticket.status !== TicketStatus.RESTORED) throw new BusinessError(ERROR_CODES.TICKET_NOT_ACTIVE, { id: ticketId });
  ticket.status = TicketStatus.CLOSED;
  ticket.closed_at = now();
  const minutes = ticket.assigned_at
    ? Math.round((new Date(ticket.closed_at as string).getTime() - new Date(ticket.assigned_at as string).getTime()) / 60000)
    : 0;
  const duration = minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
  pushLog(next, actor, "RepairTicket", LogAction.CLOSE, { id: ticket.id, duration }, "RepairTicket", ticket.id);
  return next;
};

export const toggleCrewDuty = (s: Snapshot, crewId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const crew = next.crews.find((c) => c.id === crewId);
  if (!crew) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "班组", id: crewId });
  if (crew.duty_status === CrewDutyStatus.BUSY) {
    throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "出勤中班组不能切换值班" });
  }
  crew.duty_status = crew.duty_status === CrewDutyStatus.ON_DUTY ? CrewDutyStatus.OFF_DUTY : CrewDutyStatus.ON_DUTY;
  pushLog(next, actor, "Crew", LogAction.STATUS_CHANGE, { name: crew.name, dutyStatus: crew.duty_status }, "Crew", crew.id);
  return next;
};

export const applyPart = (s: Snapshot, ticketId: number, partCode: string, quantity: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const ticket = getTicket(next, ticketId);
  const active: string[] = [TicketStatus.ASSIGNED, TicketStatus.ARRIVED, TicketStatus.REPAIRING];
  if (!active.includes(ticket.status)) throw new BusinessError(ERROR_CODES.TICKET_NOT_ACTIVE, { id: ticketId });
  const stock = next.stocks.find((p) => p.part_code === partCode);
  if (!stock) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "备件", id: partCode });
  if (quantity <= 0) throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "领用数量" });
  next.parts.unshift({
    id: nextId(next.parts),
    ticket_id: ticketId,
    part_code: stock.part_code,
    part_name: stock.part_name,
    quantity,
    warehouse_name: stock.warehouse_name,
    requested_by: actor.name,
    approved_by: null,
    approved_at: null,
    reject_reason: null,
    usage_status: PartStatus.PENDING as PStatus,
    created_at: now()
  });
  pushLog(next, actor, "SparePart", LogAction.CREATE, { ticketId, partName: stock.part_name, quantity }, "SparePart", next.parts[0].id);
  return next;
};

export const approvePart = (s: Snapshot, usageId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const usage = next.parts.find((p) => p.id === usageId);
  if (!usage) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "备件申请", id: usageId });
  if (usage.usage_status !== PartStatus.PENDING) throw new BusinessError(ERROR_CODES.PART_ALREADY_DECIDED, { id: usageId });
  const stock = next.stocks.find((p) => p.part_code === usage.part_code);
  if (!stock || stock.stock < usage.quantity) {
    throw new BusinessError(ERROR_CODES.PART_INSUFFICIENT_STOCK, { partCode: usage.part_code, stock: stock?.stock ?? 0, quantity: usage.quantity });
  }
  stock.stock -= usage.quantity;
  usage.usage_status = PartStatus.APPROVED;
  usage.approved_by = actor.name;
  usage.approved_at = now();
  next.stockTxns.unshift({
    id: nextId(next.stockTxns),
    part_code: stock.part_code,
    part_name: stock.part_name,
    warehouse_name: stock.warehouse_name,
    change: -usage.quantity,
    balance: stock.stock,
    usage_id: usage.id,
    operator: actor.name,
    remark: `工单 #${usage.ticket_id} 备件审批出库`,
    created_at: now()
  });
  pushLog(next, actor, "SparePart", LogAction.APPROVE, { id: usage.id, approver: actor.name, quantity: usage.quantity }, "SparePart", usage.id);
  return next;
};

export const rejectPart = (s: Snapshot, usageId: number, reason: string, actor: Actor): Snapshot => {
  const next = clone(s);
  const usage = next.parts.find((p) => p.id === usageId);
  if (!usage) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "备件申请", id: usageId });
  if (usage.usage_status !== PartStatus.PENDING) throw new BusinessError(ERROR_CODES.PART_ALREADY_DECIDED, { id: usageId });
  usage.usage_status = PartStatus.REJECTED;
  usage.reject_reason = reason || "库存不足";
  usage.approved_by = actor.name;
  usage.approved_at = now();
  pushLog(next, actor, "SparePart", LogAction.REJECT, { id: usage.id, approver: actor.name, reason: usage.reject_reason }, "SparePart", usage.id);
  return next;
};

export const consumePart = (s: Snapshot, usageId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const usage = next.parts.find((p) => p.id === usageId);
  if (!usage) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "备件申请", id: usageId });
  if (usage.usage_status !== PartStatus.APPROVED) throw new BusinessError(ERROR_CODES.PART_PENDING_APPROVAL, { id: usageId });
  usage.usage_status = PartStatus.CONSUMED;
  pushLog(next, actor, "SparePart", LogAction.CONSUME, { ticketId: usage.ticket_id, partName: usage.part_name, quantity: usage.quantity }, "SparePart", usage.id);
  return next;
};

export const returnPart = (s: Snapshot, usageId: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const usage = next.parts.find((p) => p.id === usageId);
  if (!usage) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "备件申请", id: usageId });
  const decided: string[] = [PartStatus.APPROVED, PartStatus.CONSUMED];
  if (!decided.includes(usage.usage_status)) throw new BusinessError(ERROR_CODES.PART_PENDING_APPROVAL, { id: usageId });
  const stock = next.stocks.find((p) => p.part_code === usage.part_code);
  if (stock) {
    stock.stock += usage.quantity;
    next.stockTxns.unshift({
      id: nextId(next.stockTxns),
      part_code: stock.part_code,
      part_name: stock.part_name,
      warehouse_name: stock.warehouse_name,
      change: usage.quantity,
      balance: stock.stock,
      usage_id: usage.id,
      operator: actor.name,
      remark: `工单 #${usage.ticket_id} 备件归还入库`,
      created_at: now()
    });
  }
  usage.usage_status = PartStatus.RETURNED;
  pushLog(next, actor, "SparePart", LogAction.RETURN, { ticketId: usage.ticket_id, partName: usage.part_name, quantity: usage.quantity }, "SparePart", usage.id);
  return next;
};

export const adjustStock = (s: Snapshot, partCode: string, newStock: number, actor: Actor): Snapshot => {
  const next = clone(s);
  const stock = next.stocks.find((p) => p.part_code === partCode);
  if (!stock) throw new BusinessError(ERROR_CODES.NOT_FOUND, { entity: "备件", id: partCode });
  if (newStock < 0) throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, { field: "库存不能为负" });
  const from = stock.stock;
  stock.stock = newStock;
  next.stockTxns.unshift({
    id: nextId(next.stockTxns),
    part_code: stock.part_code,
    part_name: stock.part_name,
    warehouse_name: stock.warehouse_name,
    change: newStock - from,
    balance: newStock,
    usage_id: null,
    operator: actor.name,
    remark: "盘点调整",
    created_at: now()
  });
  pushLog(next, actor, "SparePart", LogAction.STOCK_IN, { partCode, from, to: newStock }, "SparePart", partCode);
  return next;
};

export const ENGINE_ACTIONS = {
  createFault,
  mergeFault,
  generateTicket,
  dispatchTicket,
  arriveTicket,
  progressTicket,
  restoreTicket,
  closeTicket,
  toggleCrewDuty,
  applyPart,
  approvePart,
  rejectPart,
  consumePart,
  returnPart,
  adjustStock
};

export type EngineActionName = keyof typeof ENGINE_ACTIONS;
