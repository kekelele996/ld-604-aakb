/**
 * 资产健康度枚举
 * 出现位置：types/GridAsset.ts、constructors/GridAssetConstructor.ts、
 * constants/logTemplates.ts、constants/errorMessages.ts、
 * AssetsPage 线路/健康筛选器、StatusBadge 展示、DashboardPage 分布图、
 * 复电业务动作（store 复电时回写）、后端 constants/AssetHealthStatus.ts
 */
export const AssetHealthStatus = {
  NORMAL: "NORMAL",
  WATCH: "WATCH",
  DEGRADED: "DEGRADED",
  DANGEROUS: "DANGEROUS"
} as const;

export type AssetHealthStatus = (typeof AssetHealthStatus)[keyof typeof AssetHealthStatus];

export const AssetHealthStatusText: Record<AssetHealthStatus, string> = {
  NORMAL: "正常",
  WATCH: "关注",
  DEGRADED: "降级",
  DANGEROUS: "危急"
};

export const AssetHealthStatusOptions = Object.values(AssetHealthStatus).map((value) => ({
  label: AssetHealthStatusText[value],
  value
}));
