import { db } from "../repositories/inMemoryDatabase";
import { sparePartUsageRepository, auditLogRepository } from "../repositories/SparePartUsageRepository";
import { BusinessError } from "../utils/BusinessError";
import { appendAuditLog, assertPermission, renderLog, type WriteContext } from "./auditService";
import { repairTicketService } from "./RepairTicketService";
import type { SparePart, SparePartUsage, StockLedger } from "../types";

function reqNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BJ-${ymd}-${String(++db.seq.usage).padStart(3, "0")}`;
}

function appendLedger(entry: Omit<StockLedger, "id" | "created_at">): StockLedger {
  const ledger: StockLedger = { id: ++db.seq.ledger, created_at: new Date().toISOString(), ...entry };
  sparePartUsageRepository.saveLedger(ledger);
  return ledger;
}

export const sparePartService = {
  listParts(): SparePart[] {
    return sparePartUsageRepository.findAllParts();
  },
  listUsages(): SparePartUsage[] {
    return sparePartUsageRepository.findAllUsages();
  },
  listLedgers(): StockLedger[] {
    return sparePartUsageRepository.findAllLedgers();
  },
  getPart(id: number): SparePart {
    const part = sparePartUsageRepository.findPartById(id);
    if (!part) throw new BusinessError("PART_NOT_FOUND", {}, 404);
    return part;
  },
  getUsage(id: number): SparePartUsage {
    const usage = sparePartUsageRepository.findUsageById(id);
    if (!usage) throw new BusinessError("PART_NOT_FOUND", {}, 404);
    return usage;
  },
  apply(ctx: WriteContext, ticketId: number, partId: number, quantity: number): SparePartUsage {
    assertPermission(ctx.role, "part:apply");
    const ticket = repairTicketService.getById(ticketId);
    if (!["ASSIGNED", "ARRIVED", "REPAIRING"].includes(ticket.status)) {
      throw new BusinessError("TICKET_STATUS_ILLEGAL", { no: ticket.ticket_no });
    }
    const part = this.getPart(partId);
    const qty = Math.floor(quantity);
    if (qty <= 0) throw new BusinessError("VALIDATION_FAILED");
    if (qty > part.stock) throw new BusinessError("PART_STOCK_INSUFFICIENT", { name: part.part_name, stock: part.stock, quantity: qty });
    const usage: SparePartUsage = {
      id: db.sparePartUsages.length ? Math.max(...db.sparePartUsages.map((row) => row.id)) + 1 : 1,
      req_no: reqNo(), ticket_id: ticket.id, part_id: part.id, part_code: part.part_code, part_name: part.part_name,
      quantity: qty, warehouse_name: part.warehouse_name, applicant: ctx.actor, approved_by: null, approved_at: null,
      usage_status: "PENDING", reject_reason: null, created_at: new Date().toISOString()
    };
    sparePartUsageRepository.saveUsage(usage);
    appendAuditLog(ctx, {
      action: "part.apply", target_type: "SparePartUsage", target_id: usage.req_no,
      detail: renderLog("SparePartUsage", "apply", { ticket_no: ticket.ticket_no, req_no: usage.req_no, part_name: part.part_name, quantity: qty })
    });
    return usage;
  },
  approve(ctx: WriteContext, reqId: number): SparePartUsage {
    assertPermission(ctx.role, "part:approve");
    const usage = this.getUsage(reqId);
    if (usage.usage_status !== "PENDING") throw new BusinessError("PART_REQ_NOT_PENDING", { no: usage.req_no });
    const part = this.getPart(usage.part_id);
    if (usage.quantity > part.stock) {
      throw new BusinessError("PART_STOCK_INSUFFICIENT", { name: part.part_name, stock: part.stock, quantity: usage.quantity });
    }
    part.stock -= usage.quantity;
    usage.usage_status = "APPROVED";
    usage.approved_by = ctx.actor;
    usage.approved_at = new Date().toISOString();
    appendLedger({ part_id: part.id, part_code: part.part_code, change: -usage.quantity, balance: part.stock, reason: "审批出库扣减", ref_req_no: usage.req_no, operator: ctx.actor });
    appendAuditLog(ctx, {
      action: "part.approve", target_type: "SparePartUsage", target_id: usage.req_no,
      detail: renderLog("SparePartUsage", "approve", { req_no: usage.req_no, part_name: usage.part_name, quantity: usage.quantity, balance: part.stock })
    });
    return usage;
  },
  reject(ctx: WriteContext, reqId: number, reason: string): SparePartUsage {
    assertPermission(ctx.role, "part:reject");
    const usage = this.getUsage(reqId);
    if (usage.usage_status !== "PENDING") throw new BusinessError("PART_REQ_NOT_PENDING", { no: usage.req_no });
    usage.usage_status = "REJECTED";
    usage.reject_reason = reason.trim() || "未填写驳回原因";
    usage.approved_by = ctx.actor;
    usage.approved_at = new Date().toISOString();
    appendAuditLog(ctx, {
      action: "part.reject", target_type: "SparePartUsage", target_id: usage.req_no,
      detail: renderLog("SparePartUsage", "reject", { req_no: usage.req_no, reason: usage.reject_reason })
    });
    return usage;
  },
  returnPart(ctx: WriteContext, reqId: number, returnedQuantity: number): SparePartUsage {
    assertPermission(ctx.role, "part:return");
    const usage = this.getUsage(reqId);
    if (usage.usage_status !== "APPROVED") throw new BusinessError("PART_REQ_NOT_APPROVED", { no: usage.req_no });
    const qty = Math.min(Math.floor(returnedQuantity), usage.quantity);
    if (qty <= 0) throw new BusinessError("VALIDATION_FAILED");
    const part = this.getPart(usage.part_id);
    part.stock += qty;
    usage.usage_status = "RETURNED";
    appendLedger({ part_id: part.id, part_code: part.part_code, change: qty, balance: part.stock, reason: "余料归还回补", ref_req_no: usage.req_no, operator: ctx.actor });
    appendAuditLog(ctx, {
      action: "part.return", target_type: "SparePartUsage", target_id: usage.req_no,
      detail: renderLog("SparePartUsage", "returnPart", { req_no: usage.req_no, quantity: qty, balance: part.stock })
    });
    return usage;
  },
  adjustStock(ctx: WriteContext, partId: number, targetStock: number): SparePart {
    assertPermission(ctx.role, "stock:adjust");
    const part = this.getPart(partId);
    const target = Math.max(0, Math.floor(targetStock));
    if (target !== part.stock) {
      appendLedger({ part_id: part.id, part_code: part.part_code, change: target - part.stock, balance: target, reason: "仓管盘点调整", ref_req_no: null, operator: ctx.actor });
      appendAuditLog(ctx, {
        action: "stock.adjust", target_type: "SparePart", target_id: part.part_code,
        detail: renderLog("SparePartUsage", "stockAdjust", { part_code: part.part_code, from: part.stock, to: target })
      });
      part.stock = target;
    }
    return part;
  },
  listAuditLogs: auditLogRepository.findAll
};
