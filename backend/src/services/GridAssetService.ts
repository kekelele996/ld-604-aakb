import { db } from "../repositories/inMemoryDatabase";
import { gridAssetRepository } from "../repositories/GridAssetRepository";
import { BusinessError } from "../utils/BusinessError";
import { AssetHealthStatusText, type AssetHealthStatus } from "../constants/AssetHealthStatus";
import { appendAuditLog, assertPermission, renderLog, type WriteContext } from "./auditService";
import type { GridAsset } from "../types";

export const gridAssetService = {
  list(): GridAsset[] {
    return gridAssetRepository.findAll();
  },
  listFeederLines(): string[] {
    return [...new Set(db.gridAssets.map((row) => row.feeder_line))];
  },
  getById(id: number): GridAsset {
    const asset = gridAssetRepository.findById(id);
    if (!asset) throw new BusinessError("ASSET_NOT_FOUND", { id }, 404);
    return asset;
  },
  listAssetFaults(assetId: number) {
    const asset = this.getById(assetId);
    return db.faultReports
      .filter((report) => report.status !== "MERGED")
      .flatMap((report) => {
        const ids = [report.asset_id, ...db.faultReports.filter((row) => row.merged_into_id === report.id).map((row) => row.asset_id)];
        return ids.includes(asset.id) ? [report] : [];
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  applyHealth(ctx: WriteContext, asset: GridAsset, next: AssetHealthStatus, ticketNo: string): void {
    if (asset.health_status === next) return;
    const from = AssetHealthStatusText[asset.health_status];
    const to = AssetHealthStatusText[next];
    asset.health_status = next;
    appendAuditLog(ctx, {
      action: "asset.healthChange",
      target_type: "GridAsset",
      target_id: asset.asset_code,
      detail: renderLog("GridAsset", "healthChange", { asset_code: asset.asset_code, from, to, ticket_no: ticketNo })
    });
  },
  updateHealth(ctx: WriteContext, assetId: number, next: AssetHealthStatus): GridAsset {
    assertPermission(ctx.role, "asset:update");
    const asset = this.getById(assetId);
    this.applyHealth(ctx, asset, next, "手工调整");
    return asset;
  }
};
