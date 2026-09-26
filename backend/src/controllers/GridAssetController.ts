import type { Request, Response, NextFunction } from "express";
import { gridAssetService } from "../services/GridAssetService";
import type { AssetHealthStatus } from "../constants/AssetHealthStatus";

/** controller 负责参数解析与 HTTP 包装；业务异常由全局 errorHandler 统一兜底 */
export const gridAssetController = {
  list: (req: Request, res: Response) => {
    const line = typeof req.query.feeder_line === "string" ? req.query.feeder_line : "";
    const rows = gridAssetService.list().filter((row) => !line || row.feeder_line === line);
    res.json(rows);
  },
  history: (req: Request, res: Response) => {
    res.json(gridAssetService.listAssetFaults(Number(req.params.id)));
  },
  updateHealth: (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = { actor: req.user!.name, role: req.user!.role };
      const row = gridAssetService.updateHealth(ctx, Number(req.params.id), req.body.health_status as AssetHealthStatus);
      res.json(row);
    } catch (error) { next(error); }
  }
};
