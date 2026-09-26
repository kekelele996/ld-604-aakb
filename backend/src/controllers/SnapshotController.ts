import type { Request, Response } from "express";
import { dataStore } from "../repositories/InMemoryStore";

/** GET /api/snapshot：五页共享的全量数据 */
export const snapshotController = {
  get: (_req: Request, res: Response) => {
    res.json(dataStore.getSnapshot());
  },
  reset: (_req: Request, res: Response) => {
    res.json(dataStore.reset());
  }
};
