import type { Request, Response, NextFunction } from "express";
import { crewService } from "../services/CrewService";

export const crewController = {
  list: (_req: Request, res: Response) => res.json(crewService.list()),
  toggleDuty: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      res.json(crewService.toggleDuty(ctx, Number(req.params.id)));
    } catch (error) { next(error); }
  }
};
