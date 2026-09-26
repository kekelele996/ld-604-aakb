/**
 * 报修单状态：PENDING 待处理 → MERGED 已并入主报修 / TICKETED 已生成工单
 * → RESOLVED 随复电关闭。同线路重复报修合并时从单状态变为 MERGED。
 */
export const FaultStatus = {
  PENDING: "PENDING",
  MERGED: "MERGED",
  TICKETED: "TICKETED",
  RESOLVED: "RESOLVED"
} as const;

export type FaultStatus = (typeof FaultStatus)[keyof typeof FaultStatus];

export const FaultStatusText: Record<FaultStatus, string> = {
  PENDING: "待处理",
  MERGED: "已合并",
  TICKETED: "已派工",
  RESOLVED: "已复电"
};

export const FaultStatusType: Record<FaultStatus, "warning" | "info" | "primary" | "success"> = {
  PENDING: "warning",
  MERGED: "info",
  TICKETED: "primary",
  RESOLVED: "success"
};
