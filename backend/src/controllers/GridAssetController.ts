import type { Request, Response, NextFunction } from "express";
import { gridAssetService } from "../services/GridAssetService";
import { toGridAssetResponse } from "../constructors/GridAssetDtoFactory";

/** controller 只做参数提取/响应包装，业务异常由 service 抛出、errorHandler 收口 */
export const gridAssetController = {
  list: (_req: Request, res: Response) => {
    res.json(gridAssetService.list().map(toGridAssetResponse));
  },
  feederLines: (_req: Request, res: Response) => {
    res.json(gridAssetService.feederLines());
  },
  detail: (req: Request, res: Response, next: NextFunction) => {
    const row = gridAssetService.detail(Number(req.params.id));
    if (!row) return next();
    res.json(toGridAssetResponse(row));
  }
};
