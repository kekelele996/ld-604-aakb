import type { Request, Response, NextFunction } from "express";
import { sparePartService } from "../services/SparePartService";
import type { PartUsagePayload, ApprovePayload, StockAdjustPayload } from "../types";

export const sparePartUsageController = {
  listParts: (_req: Request, res: Response) => res.json(sparePartService.listParts()),
  listUsages: (_req: Request, res: Response) => res.json(sparePartService.listUsages()),
  listLedgers: (_req: Request, res: Response) => res.json(sparePartService.listLedgers()),
  apply: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const { ticket_id, part_id, quantity } = req.body as PartUsagePayload;
      res.status(201).json(sparePartService.apply(ctx, Number(ticket_id), Number(part_id), Number(quantity)));
    } catch (error) { next(error); }
  },
  approve: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      res.json(sparePartService.approve(ctx, Number(req.params.id)));
    } catch (error) { next(error); }
  },
  reject: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const { reject_reason } = req.body as ApprovePayload;
      res.json(sparePartService.reject(ctx, Number(req.params.id), String(reject_reason ?? "")));
    } catch (error) { next(error); }
  },
  returnPart: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      res.json(sparePartService.returnPart(ctx, Number(req.params.id), Number(req.body.quantity)));
    } catch (error) { next(error); }
  },
  adjustStock: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const { stock } = req.body as StockAdjustPayload;
      res.json(sparePartService.adjustStock(ctx, Number(req.params.id), Number(stock)));
    } catch (error) { next(error); }
  },
  listAuditLogs: (_req: Request, res: Response) => res.json(sparePartService.listAuditLogs())
};
