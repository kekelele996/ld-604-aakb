import type { Response, NextFunction } from "express";
import { crewService } from "../services/CrewService";
import { BusinessError } from "../constants/errorMessages";
import type { AuthedRequest } from "../types/express";

export const crewController = {
  list: (_req: AuthedRequest, res: Response) => {
    res.json(crewService.list());
  },
  toggleDuty: (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new BusinessError("AUTH_REQUIRED", {}, 401);
      const { crewId } = req.body as { crewId: number };
      res.json(crewService.toggleDuty(Number(crewId), req.user));
    } catch (err) {
      next(err);
    }
  }
};
