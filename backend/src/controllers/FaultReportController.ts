import type { Request, Response, NextFunction } from "express";
import { faultReportService } from "../services/FaultReportService";
import { BusinessError } from "../constants/errorMessages";
import type { AuthedRequest } from "../types/express";
import type { FaultFormInput } from "../services/engine";

export const faultReportController = {
  list: (_req: Request, res: Response) => {
    res.json(faultReportService.list());
  },

  duplicates: (req: Request, res: Response) => {
    res.json(faultReportService.duplicates(Number(req.params.id)));
  },

  register: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const form = req.body as FaultFormInput;
      const snapshot = faultReportService.register(form, req.user);
      res.status(201).json(snapshot);
    } catch (err) {
      next(err);
    }
  },

  merge: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { id, masterId } = req.body as { id: number; masterId: number };
      res.json(faultReportService.merge(Number(id), Number(masterId), req.user));
    } catch (err) {
      next(err);
    }
  },

  generate: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { masterFaultId } = req.body as { masterFaultId: number };
      res.status(201).json(faultReportService.generateTicket(Number(masterFaultId), req.user));
    } catch (err) {
      next(err);
    }
  }
};
