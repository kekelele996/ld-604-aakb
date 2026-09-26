export const CrewDutyStatusText = {
  ON_DUTY: "值班中",
  ON_SITE: "出勤中",
  OFF_DUTY: "休息"
} as const;

/** 可派工的值班状态：仅值班中班组承接新工单 */
export const DispatchableDutyStatuses = ["ON_DUTY"] as const;

/** 态势页排序权重：出勤中在前，值班次之，休息最后 */
export const CrewDutyOrder: Record<string, number> = { ON_SITE: 0, ON_DUTY: 1, OFF_DUTY: 2 };

export const SkillTagText: Record<string, string> = {
  OUTAGE: "停电抢修",
  CABLE: "电缆",
  TRANSFORMER: "变压器",
  SWITCH: "开关",
  METER: "计量",
  LIVE: "带电作业"
};
