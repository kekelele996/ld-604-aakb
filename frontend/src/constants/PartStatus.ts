/**
 * 备件领用状态：申请 PENDING → 仓管审批 APPROVED（审批通过才真正扣库存）
 * → CONSUMED 消耗 / RETURNED 归还；REJECTED 为审批驳回。
 */
export const PartStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CONSUMED: "CONSUMED",
  RETURNED: "RETURNED"
} as const;

export type PartStatus = (typeof PartStatus)[keyof typeof PartStatus];

export const PartStatusText: Record<PartStatus, string> = {
  PENDING: "待审批",
  APPROVED: "已批准待出库",
  REJECTED: "已驳回",
  CONSUMED: "已消耗",
  RETURNED: "已归还"
};

export const PartStatusType: Record<PartStatus, "warning" | "primary" | "danger" | "success" | "info"> = {
  PENDING: "warning",
  APPROVED: "primary",
  REJECTED: "danger",
  CONSUMED: "success",
  RETURNED: "info"
};
