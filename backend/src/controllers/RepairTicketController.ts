import type { Response, NextFunction } from "express";
import { repairTicketService } from "../services/RepairTicketService";
import { BusinessError } from "../constants/errorMessages";
import type { Priority } from "../constants/Role";
import type { AuthedRequest } from "../types/express";

const asNum = (v: unknown): number => Number(v);

export const repairTicketController = {
  list: (_req: AuthedRequest, res: Response) => {
    res.json(repairTicketService.list());
  },

  dispatch: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { ticketId, teamId, priority } = req.body as { ticketId: number; teamId: number; priority: Priority };
      res.json(repairTicketService.dispatch(asNum(ticketId), asNum(teamId), priority, req.user));
    } catch (err) {
      next(err);
    }
  },

  arrive: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { ticketId } = req.body as { ticketId: number };
      res.json(repairTicketService.arrive(asNum(ticketId), req.user));
    } catch (err) {
      next(err);
    }
  },

  progress: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { ticketId } = req.body as { ticketId: number };
      res.json(repairTicketService.progress(asNum(ticketId), req.user));
    } catch (err) {
      next(err);
    }
  },

  restore: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { ticketId, remark } = req.body as { ticketId: number; remark?: string };
      res.json(repairTicketService.restore(asNum(ticketId), remark ?? "", req.user));
    } catch (err) {
      next(err);
    }
  },

  close: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { ticketId } = req.body as { ticketId: number };
      res.json(repairTicketService.close(asNum(ticketId), req.user));
    } catch (err) {
      next(err);
    }
  }
};
