/** 报修严重程度，生成工单时映射为派工优先级 */
export const Severity = {
  NORMAL: "NORMAL",
  URGENT: "URGENT",
  CRITICAL: "CRITICAL"
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

export const SeverityText: Record<Severity, string> = {
  NORMAL: "一般",
  URGENT: "紧急",
  CRITICAL: "危急"
};
