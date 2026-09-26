/** 班组值班状态：派工时 useCrewAvailability 只推荐 ON_DUTY 且无在制工单的班组 */
export const CrewDutyStatus = {
  ON_DUTY: "ON_DUTY",
  BUSY: "BUSY",
  OFF_DUTY: "OFF_DUTY"
} as const;

export type CrewDutyStatus = (typeof CrewDutyStatus)[keyof typeof CrewDutyStatus];

export const CrewDutyStatusText: Record<CrewDutyStatus, string> = {
  ON_DUTY: "值班待命",
  BUSY: "出勤中",
  OFF_DUTY: "休班"
};

export const CrewDutyStatusType: Record<CrewDutyStatus, "success" | "warning" | "info"> = {
  ON_DUTY: "success",
  BUSY: "warning",
  OFF_DUTY: "info"
};
