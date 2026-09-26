import type { Request, Response, NextFunction } from "express";
import { faultReportService } from "../services/FaultReportService";
import type { FaultReportPayload, MergePayload } from "../types";

export const faultReportController = {
  list: (_req: Request, res: Response) => res.json(faultReportService.list()),
  register: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      res.status(201).json(faultReportService.register(ctx, req.body as FaultReportPayload));
    } catch (error) { next(error); }
  },
  merge: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const { source_id, target_id } = req.body as MergePayload;
      res.json(faultReportService.merge(ctx, Number(source_id), Number(target_id)));
    } catch (error) { next(error); }
  },
  createTicket: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      res.status(201).json(faultReportService.createTicket(ctx, Number(req.params.id)));
    } catch (error) { next(error); }
  }
};
