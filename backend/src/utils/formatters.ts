import { FaultType } from "../constants/FaultType";
import { TicketStatus } from "../constants/TicketStatus";
import { AssetHealthStatus } from "../constants/AssetHealthStatus";
import { CrewDutyStatus, PartStatus, FaultStatus, Severity, Priority } from "../constants/Role";

/** 混合格式化工具（与前端 utils/formatters 对应，多个 service/controller 共同依赖） */

const FAULT_TYPE_TEXT: Record<string, string> = {
  [FaultType.OUTAGE]: "停电",
  [FaultType.VOLTAGE_LOW]: "低电压",
  [FaultType.TRIP]: "开关跳闸",
  [FaultType.EQUIPMENT_DAMAGE]: "设备损坏",
  [FaultType.SAFETY_RISK]: "安全隐患"
};

const TICKET_STATUS_TEXT: Record<string, string> = {
  [TicketStatus.WAIT_DISPATCH]: "待派工",
  [TicketStatus.ASSIGNED]: "已派工",
  [TicketStatus.ARRIVED]: "已到场",
  [TicketStatus.REPAIRING]: "处理中",
  [TicketStatus.RESTORED]: "已复电",
  [TicketStatus.CLOSED]: "已归档"
};

const HEALTH_TEXT: Record<string, string> = {
  [AssetHealthStatus.NORMAL]: "正常",
  [AssetHealthStatus.WATCH]: "关注",
  [AssetHealthStatus.DEGRADED]: "降级",
  [AssetHealthStatus.DANGEROUS]: "危急"
};

export const formatStatusText = (value: string): string =>
  FAULT_TYPE_TEXT[value] ??
  TICKET_STATUS_TEXT[value] ??
  HEALTH_TEXT[value] ??
  ({
    ON_DUTY: "值班待命", BUSY: "出勤中", OFF_DUTY: "休班",
    PENDING: "待审批", APPROVED: "已批准待出库", REJECTED: "已驳回", CONSUMED: "已消耗", RETURNED: "已归还",
    MERGED: "已合并", TICKETED: "已派工", RESOLVED: "已复电",
    NORMAL: "一般", URGENT: "紧急", CRITICAL: "危急",
    LOW: "低", MEDIUM: "中", HIGH: "高"
  } as Record<string, string>)[value] ??
  value;

export const toAuditTarget = (type: string, id: string | number): string => `${type}#${id}`;

export const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString().replace("T", " ").slice(0, 16);
};

export { Priority, Severity, PartStatus, FaultStatus, CrewDutyStatus };
