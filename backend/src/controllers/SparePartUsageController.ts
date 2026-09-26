import type { Response, NextFunction } from "express";
import { sparePartUsageService } from "../services/SparePartUsageService";
import { BusinessError } from "../constants/errorMessages";
import type { AuthedRequest } from "../types/express";

export const sparePartUsageController = {
  listUsages: (_req: AuthedRequest, res: Response) => res.json(sparePartUsageService.listUsages()),
  listStocks: (_req: AuthedRequest, res: Response) => res.json(sparePartUsageService.listStocks()),
  listTxns: (_req: AuthedRequest, res: Response) => res.json(sparePartUsageService.listTxns()),

  apply: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { ticketId, partCode, quantity } = req.body as { ticketId: number; partCode: string; quantity: number };
      res.status(201).json(sparePartUsageService.apply(Number(ticketId), partCode, Number(quantity), req.user));
    } catch (err) {
      next(err);
    }
  },
  approve: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { usageId } = req.body as { usageId: number };
      res.json(sparePartUsageService.approve(Number(usageId), req.user));
    } catch (err) {
      next(err);
    }
  },
  reject: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { usageId, reason } = req.body as { usageId: number; reason?: string };
      res.json(sparePartUsageService.reject(Number(usageId), reason ?? "", req.user));
    } catch (err) {
      next(err);
    }
  },
  consume: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { usageId } = req.body as { usageId: number };
      res.json(sparePartUsageService.consume(Number(usageId), req.user));
    } catch (err) {
      next(err);
    }
  },
  returnPart: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { usageId } = req.body as { usageId: number };
      res.json(sparePartUsageService.returnPart(Number(usageId), req.user));
    } catch (err) {
      next(err);
    }
  },
  adjustStock: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { partCode, newStock } = req.body as { partCode: string; newStock: number };
      res.json(sparePartUsageService.adjustStock(partCode, Number(newStock), req.user));
    } catch (err) {
      next(err);
    }
  }
};
