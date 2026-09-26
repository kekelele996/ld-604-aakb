export const FaultType = ["OUTAGE", "VOLTAGE_LOW", "TRIP", "EQUIPMENT_DAMAGE", "SAFETY_RISK"] as const;
export type FaultType = (typeof FaultType)[number];
export const FaultTypeText: Record<FaultType, string> = {
  OUTAGE: "停电",
  VOLTAGE_LOW: "低电压",
  TRIP: "开关跳闸",
  EQUIPMENT_DAMAGE: "设备损坏",
  SAFETY_RISK: "安全隐患"
};
export const FaultTypeDefaultSeverity: Record<FaultType, "NORMAL" | "URGENT" | "CRITICAL"> = {
  OUTAGE: "CRITICAL", VOLTAGE_LOW: "NORMAL", TRIP: "URGENT", EQUIPMENT_DAMAGE: "URGENT", SAFETY_RISK: "CRITICAL"
};
export const FaultTypeHealthImpact: Record<FaultType, "WATCH" | "DEGRADED" | "DANGEROUS"> = {
  OUTAGE: "DANGEROUS", VOLTAGE_LOW: "WATCH", TRIP: "DEGRADED", EQUIPMENT_DAMAGE: "DEGRADED", SAFETY_RISK: "DANGEROUS"
};
export const FaultTypeRequiredSkill: Record<FaultType, string> = {
  OUTAGE: "OUTAGE", VOLTAGE_LOW: "METER", TRIP: "SWITCH", EQUIPMENT_DAMAGE: "TRANSFORMER", SAFETY_RISK: "LIVE"
};
