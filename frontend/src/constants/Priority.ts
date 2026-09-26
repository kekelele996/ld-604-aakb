/** 工单优先级（派工时调度员可调整） */
export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT"
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const PriorityText: Record<Priority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "特急"
};

export const PriorityType: Record<Priority, "info" | "" | "warning" | "danger"> = {
  LOW: "info",
  MEDIUM: "",
  HIGH: "warning",
  URGENT: "danger"
};

export const PriorityOptions = Object.values(Priority).map((value) => ({
  label: PriorityText[value],
  value
}));

/** 报修严重程度 → 默认派工优先级（合并报修取最高） */
export const SeverityToPriority: Record<import("./Severity").Severity, Priority> = {
  NORMAL: Priority.MEDIUM,
  URGENT: Priority.HIGH,
  CRITICAL: Priority.URGENT
};
