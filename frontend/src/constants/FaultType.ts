/**
 * 故障类型枚举 —— 前后端必须保持一致
 * 出现位置：types/FaultReport.ts、constructors/FaultReportConstructor.ts、
 * constants/logTemplates.ts、constants/errorMessages.ts、
 * FaultsPage 筛选器、StatusBadge/PriorityTag 展示、后端 constants/FaultType.ts
 */
export const FaultType = {
  OUTAGE: "OUTAGE",
  VOLTAGE_LOW: "VOLTAGE_LOW",
  TRIP: "TRIP",
  EQUIPMENT_DAMAGE: "EQUIPMENT_DAMAGE",
  SAFETY_RISK: "SAFETY_RISK"
} as const;

export type FaultType = (typeof FaultType)[keyof typeof FaultType];

export const FaultTypeText: Record<FaultType, string> = {
  OUTAGE: "停电",
  VOLTAGE_LOW: "低电压",
  TRIP: "开关跳闸",
  EQUIPMENT_DAMAGE: "设备损坏",
  SAFETY_RISK: "安全隐患"
};

export const FaultTypeOptions = Object.values(FaultType).map((value) => ({
  label: FaultTypeText[value],
  value
}));
