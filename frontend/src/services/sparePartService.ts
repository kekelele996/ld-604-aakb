import { localDb } from "../mocks/localDb";
import { BusinessError } from "../constants/BusinessError";
import { writeLog, renderLog, assertPermission, type WriteContext } from "./auditService";
import { createDefaultSparePartUsage, createStockLedger } from "../constructors/SparePartUsageConstructor";
import { getTicket } from "./repairTicketService";
import type { SparePart, SparePartUsage, StockLedger } from "../types/SparePartUsage";

function nextReqNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  localDb.seq.usage += 1;
  return `BJ-${ymd}-${String(localDb.seq.usage).padStart(3, "0")}`;
}

export function listSpareParts(): SparePart[] {
  return localDb.spareParts;
}

export function listPartUsages(): SparePartUsage[] {
  return localDb.sparePartUsages;
}

export function listStockLedgers(): StockLedger[] {
  return localDb.stockLedgers;
}

export function getPart(id: number): SparePart {
  const part = localDb.spareParts.find((row) => row.id === id);
  if (!part) throw new BusinessError("PART_NOT_FOUND");
  return part;
}

function appendLedger(entry: Omit<StockLedger, "id" | "created_at">): StockLedger {
  const ledger = createStockLedger({
    id: ++localDb.seq.ledger,
    created_at: new Date().toISOString(),
    ...entry
  });
  localDb.stockLedgers.unshift(ledger);
  return ledger;
}

/** 班组长为工单申请备件（仅 PENDING 记录，不扣库存） */
export function applyPart(ctx: WriteContext, ticketId: number, partId: number, quantity: number): SparePartUsage {
  assertPermission(ctx.role, "part:apply");
  const ticket = getTicket(ticketId);
  if (!["ARRIVED", "REPAIRING", "ASSIGNED"].includes(ticket.status)) {
    throw new BusinessError("TICKET_STATUS_ILLEGAL", { no: ticket.ticket_no });
  }
  const part = getPart(partId);
  const qty = Math.floor(quantity);
  if (qty <= 0) throw new BusinessError("VALIDATION_FAILED");
  if (qty > part.stock) throw new BusinessError("PART_STOCK_INSUFFICIENT", { name: part.part_name, stock: part.stock, quantity: qty });

  const usage = createDefaultSparePartUsage({
    id: ++localDb.seq.usage,
    req_no: nextReqNo(),
    ticket_id: ticket.id,
    part_id: part.id,
    part_code: part.part_code,
    part_name: part.part_name,
    quantity: qty,
    warehouse_name: part.warehouse_name,
    applicant: ctx.actor,
    created_at: new Date().toISOString()
  });
  localDb.sparePartUsages.unshift(usage);

  writeLog(ctx, {
    action: "part.apply",
    target_type: "SparePartUsage",
    target_id: usage.req_no,
    detail: renderLog("SparePartUsage", "apply", {
      ticket_no: ticket.ticket_no,
      req_no: usage.req_no,
      part_name: part.part_name,
      quantity: qty
    })
  });
  return usage;
}

/** 仓管审批通过：此刻才扣减库存并写流水（申请阶段不动库存） */
export function approvePart(ctx: WriteContext, reqId: number): SparePartUsage {
  assertPermission(ctx.role, "part:approve");
  const usage = localDb.sparePartUsages.find((row) => row.id === reqId);
  if (!usage) throw new BusinessError("PART_NOT_FOUND");
  if (usage.usage_status !== "PENDING") throw new BusinessError("PART_REQ_NOT_PENDING", { no: usage.req_no });
  const part = getPart(usage.part_id);
  if (usage.quantity > part.stock) {
    throw new BusinessError("PART_STOCK_INSUFFICIENT", { name: part.part_name, stock: part.stock, quantity: usage.quantity });
  }

  part.stock -= usage.quantity;
  usage.usage_status = "APPROVED";
  usage.approved_by = ctx.actor;
  usage.approved_at = new Date().toISOString();
  appendLedger({
    part_id: part.id,
    part_code: part.part_code,
    change: -usage.quantity,
    balance: part.stock,
    reason: "审批出库扣减",
    ref_req_no: usage.req_no,
    operator: ctx.actor
  });

  writeLog(ctx, {
    action: "part.approve",
    target_type: "SparePartUsage",
    target_id: usage.req_no,
    detail: renderLog("SparePartUsage", "approve", {
      req_no: usage.req_no,
      part_name: usage.part_name,
      quantity: usage.quantity,
      balance: part.stock
    })
  });
  return usage;
}

/** 仓管驳回：不动库存 */
export function rejectPart(ctx: WriteContext, reqId: number, reason: string): SparePartUsage {
  assertPermission(ctx.role, "part:reject");
  const usage = localDb.sparePartUsages.find((row) => row.id === reqId);
  if (!usage) throw new BusinessError("PART_NOT_FOUND");
  if (usage.usage_status !== "PENDING") throw new BusinessError("PART_REQ_NOT_PENDING", { no: usage.req_no });
  usage.usage_status = "REJECTED";
  usage.reject_reason = reason.trim() || "未填写驳回原因";
  usage.approved_by = ctx.actor;
  usage.approved_at = new Date().toISOString();

  writeLog(ctx, {
    action: "part.reject",
    target_type: "SparePartUsage",
    target_id: usage.req_no,
    detail: renderLog("SparePartUsage", "reject", { req_no: usage.req_no, reason: usage.reject_reason ?? "" })
  });
  return usage;
}

/** 余料归还（班组长登记归还、库存回补，需已审批出库） */
export function returnPart(ctx: WriteContext, reqId: number, returnedQuantity: number): SparePartUsage {
  assertPermission(ctx.role, "part:return");
  const usage = localDb.sparePartUsages.find((row) => row.id === reqId);
  if (!usage) throw new BusinessError("PART_NOT_FOUND");
  if (usage.usage_status !== "APPROVED") throw new BusinessError("PART_REQ_NOT_APPROVED", { no: usage.req_no });
  const qty = Math.min(Math.floor(returnedQuantity), usage.quantity);
  if (qty <= 0) throw new BusinessError("VALIDATION_FAILED");
  const part = getPart(usage.part_id);
  part.stock += qty;
  usage.usage_status = "RETURNED";
  appendLedger({
    part_id: part.id,
    part_code: part.part_code,
    change: qty,
    balance: part.stock,
    reason: "余料归还回补",
    ref_req_no: usage.req_no,
    operator: ctx.actor
  });

  writeLog(ctx, {
    action: "part.return",
    target_type: "SparePartUsage",
    target_id: usage.req_no,
    detail: renderLog("SparePartUsage", "returnPart", {
      req_no: usage.req_no,
      quantity: qty,
      balance: part.stock
    })
  });
  return usage;
}

/** 仓管盘点调整库存（正负向），写流水 */
export function adjustStock(ctx: WriteContext, partId: number, targetStock: number): SparePart {
  assertPermission(ctx.role, "stock:adjust");
  const part = getPart(partId);
  const target = Math.max(0, Math.floor(targetStock));
  if (target === part.stock) return part;
  appendLedger({
    part_id: part.id,
    part_code: part.part_code,
    change: target - part.stock,
    balance: target,
    reason: "仓管盘点调整",
    ref_req_no: null,
    operator: ctx.actor
  });
  writeLog(ctx, {
    action: "stock.adjust",
    target_type: "SparePart",
    target_id: part.part_code,
    detail: renderLog("SparePartUsage", "stockAdjust", { part_code: part.part_code, from: part.stock, to: target })
  });
  part.stock = target;
  return part;
}
