export const PartUsageStatusText = {
  PENDING: "待审批",
  APPROVED: "已批准",
  REJECTED: "已驳回",
  RETURNED: "已归还"
} as const;

/** 审批通过即视为出库消耗、扣减库存；归还时回补 */
export const StockChangeReasonText = {
  APPROVE_CONSUME: "审批出库扣减",
  RETURN_REFUND: "余料归还回补",
  MANUAL_ADJUST: "仓管盘点调整"
} as const;
