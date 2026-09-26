export const FaultType = {
  OUTAGE: "OUTAGE",
  VOLTAGE_LOW: "VOLTAGE_LOW",
  TRIP: "TRIP",
  EQUIPMENT_DAMAGE: "EQUIPMENT_DAMAGE",
  SAFETY_RISK: "SAFETY_RISK"
} as const;

export type FaultType = (typeof FaultType)[keyof typeof FaultType];

export const FAULT_TYPES: FaultType[] = Object.values(FaultType);
