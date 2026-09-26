/** 种子数据专用枚举聚合（来源仍为 constants/Role，报修渠道仅种子使用） */
export { Severity, FaultStatus, Priority, CrewDutyStatus, PartStatus } from "./Role";

export const ReportChannelStub = {
  HOTLINE: "HOTLINE",
  APP: "APP",
  ONSITE: "ONSITE",
  GRID_PATROL: "GRID_PATROL"
} as const;
