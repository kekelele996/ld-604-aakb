/** 报修单状态 / 严重程度 / 报修渠道 文案与颜色（筛选器与详情共用） */
export const FaultStatusText = {
  PENDING: "待处理",
  TICKETED: "已生成工单",
  MERGED: "已合并",
  RESTORED: "已复电",
  CLOSED: "已归档"
} as const;

export const SeverityText = {
  NORMAL: "一般",
  URGENT: "紧急",
  CRITICAL: "特急"
} as const;

export const SeverityRank = { NORMAL: 1, URGENT: 2, CRITICAL: 3 } as const;

export const ReportChannelText = {
  HOTLINE: "95598热线",
  APP: "网上国网",
  PATROL: "巡检上报",
  ONSITE: "现场上报"
} as const;
