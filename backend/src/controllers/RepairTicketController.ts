import type { Request, Response, NextFunction } from "express";
import { repairTicketService } from "../services/RepairTicketService";
import type { DispatchPayload, RestorePayload } from "../types";

export const repairTicketController = {
  list: (_req: Request, res: Response) => res.json(repairTicketService.list()),
  detail: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = repairTicketService.getById(Number(req.params.id));
      res.json({ ...ticket, reports: repairTicketService.reportsOf(ticket), assets: repairTicketService.assetsOf(ticket) });
    } catch (error) { next(error); }
  },
  dispatch: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const { team_id } = req.body as DispatchPayload;
      res.json(repairTicketService.dispatch(ctx, Number(req.params.id), Number(team_id)));
    } catch (error) { next(error); }
  },
  advance: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const { restore_note } = req.body as RestorePayload;
      res.json(repairTicketService.advance(ctx, Number(req.params.id), String(restore_note ?? "")));
    } catch (error) { next(error); }
  }
};
