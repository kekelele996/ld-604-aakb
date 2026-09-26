/** 报修来源渠道 */
export const ReportChannel = {
  HOTLINE: "HOTLINE",
  APP: "APP",
  ONSITE: "ONSITE",
  GRID_PATROL: "GRID_PATROL"
} as const;

export type ReportChannel = (typeof ReportChannel)[keyof typeof ReportChannel];

export const ReportChannelText: Record<ReportChannel, string> = {
  HOTLINE: "95598 热线",
  APP: "网上国网 App",
  ONSITE: "上门登记",
  GRID_PATROL: "巡检上报"
};

export const ReportChannelOptions = Object.values(ReportChannel).map((value) => ({
  label: ReportChannelText[value],
  value
}));
