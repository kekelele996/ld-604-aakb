export const AssetHealthStatus = {
  NORMAL: "NORMAL",
  WATCH: "WATCH",
  DEGRADED: "DEGRADED",
  DANGEROUS: "DANGEROUS"
} as const;

export type AssetHealthStatus = (typeof AssetHealthStatus)[keyof typeof AssetHealthStatus];
