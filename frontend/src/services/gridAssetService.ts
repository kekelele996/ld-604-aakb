import { localDb } from "../mocks/localDb";
import { BusinessError } from "../constants/BusinessError";
import { AssetHealthStatusText } from "../constants/AssetHealthStatus";
import { writeLog, renderLog, assertPermission, type WriteContext } from "./auditService";
import type { GridAsset } from "../types/GridAsset";
import type { AssetHealthStatus } from "../types/AssetHealthStatus";

export function listAssets(): GridAsset[] {
  return localDb.gridAssets;
}

export function getAsset(id: number): GridAsset {
  const asset = localDb.gridAssets.find((row) => row.id === id);
  if (!asset) throw new BusinessError("ASSET_NOT_FOUND", { id });
  return asset;
}

export function listFeederLines(): string[] {
  return [...new Set(localDb.gridAssets.map((row) => row.feeder_line))];
}

/** 资产台账历史故障：该资产上所有非合并态报修（合并单挂主资产，也按主单资产聚合） */
export function listAssetFaults(assetId: number) {
  const asset = getAsset(assetId);
  return localDb.faultReports
    .filter((report) => report.status !== "MERGED")
    .flatMap((report) => {
      const relatedAssetIds = [report.asset_id];
      const merged = localDb.faultReports.filter((row) => row.merged_into_id === report.id);
      merged.forEach((row) => relatedAssetIds.push(row.asset_id));
      return relatedAssetIds.includes(asset.id) ? [{ report, merged }] : [];
    })
    .sort((a, b) => b.report.created_at.localeCompare(a.report.created_at));
}

/**
 * 复电联动更新资产健康状态（向上取严，NORMAL 表示恢复正常）。
 * 由 ticketService 在派工/复电时调用，写 GridAsset.healthChange 日志。
 */
export function applyHealthStatus(
  ctx: WriteContext,
  asset: GridAsset,
  next: AssetHealthStatus,
  ticketNo: string
): void {
  if (asset.health_status === next) return;
  const from = AssetHealthStatusText[asset.health_status];
  const to = AssetHealthStatusText[next];
  asset.health_status = next;
  writeLog(ctx, {
    action: "asset.healthChange",
    target_type: "GridAsset",
    target_id: asset.asset_code,
    detail: renderLog("GridAsset", "healthChange", {
      asset_code: asset.asset_code,
      from,
      to,
      ticket_no: ticketNo
    })
  });
}

/** 调度员/班组长可在台账页手工调整健康状态（审计需要） */
export function updateHealthStatus(ctx: WriteContext, assetId: number, next: AssetHealthStatus): void {
  assertPermission(ctx.role, "asset:update");
  const asset = getAsset(assetId);
  applyHealthStatus(ctx, asset, next, "手工调整");
}
