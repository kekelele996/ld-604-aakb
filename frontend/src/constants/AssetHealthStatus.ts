export const AssetHealthStatus = ["NORMAL", "WATCH", "DEGRADED", "DANGEROUS"] as const;
export type AssetHealthStatus = (typeof AssetHealthStatus)[number];
export const AssetHealthStatusText: Record<AssetHealthStatus, string> = {
  NORMAL: "正常",
  WATCH: "关注",
  DEGRADED: "降级",
  DANGEROUS: "危险"
};
/** 健康档位颜色映射（StatusBadge / AssetTree / 资产列表共用） */
export const AssetHealthStatusColor: Record<AssetHealthStatus, string> = {
  NORMAL: "#24874f",
  WATCH: "#b8860b",
  DEGRADED: "#d2691e",
  DANGEROUS: "#c0392b"
};
