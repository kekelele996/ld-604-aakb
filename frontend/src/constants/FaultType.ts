export const FaultType = ["OUTAGE", "VOLTAGE_LOW", "TRIP", "EQUIPMENT_DAMAGE", "SAFETY_RISK"] as const;
export type FaultType = (typeof FaultType)[number];
export const FaultTypeText: Record<FaultType, string> = {
  OUTAGE: "停电",
  VOLTAGE_LOW: "低电压",
  TRIP: "开关跳闸",
  EQUIPMENT_DAMAGE: "设备损坏",
  SAFETY_RISK: "安全隐患"
};
/** 故障类型默认严重程度，登记报修时自动分级 */
export const FaultTypeDefaultSeverity: Record<FaultType, "NORMAL" | "URGENT" | "CRITICAL"> = {
  OUTAGE: "CRITICAL",
  VOLTAGE_LOW: "NORMAL",
  TRIP: "URGENT",
  EQUIPMENT_DAMAGE: "URGENT",
  SAFETY_RISK: "CRITICAL"
};
/** 故障类型对应的资产健康降级档位 */
export const FaultTypeHealthImpact: Record<FaultType, "WATCH" | "DEGRADED" | "DANGEROUS"> = {
  OUTAGE: "DANGEROUS",
  VOLTAGE_LOW: "WATCH",
  TRIP: "DEGRADED",
  EQUIPMENT_DAMAGE: "DEGRADED",
  SAFETY_RISK: "DANGEROUS"
};
/** 故障类型对班组技能的要求（派工匹配 skill_tags） */
export const FaultTypeRequiredSkill: Record<FaultType, string> = {
  OUTAGE: "OUTAGE",
  VOLTAGE_LOW: "METER",
  TRIP: "SWITCH",
  EQUIPMENT_DAMAGE: "TRANSFORMER",
  SAFETY_RISK: "LIVE"
};
