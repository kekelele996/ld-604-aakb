import { TicketStatusText } from "../constants/TicketStatus";
import { AssetHealthStatusText, AssetHealthStatusColor } from "../constants/AssetHealthStatus";
import { FaultStatusText, SeverityText } from "../constants/FaultStatus";
import { CrewDutyStatusText } from "../constants/CrewDutyStatus";
import { PartUsageStatusText } from "../constants/PartUsageStatus";

export interface BadgeMeta {
  text: string;
  /** Element Plus 标签类型 */
  type: "success" | "info" | "warning" | "danger" | "primary";
  /** 自定义底色（健康状态用风险色） */
  color?: string;
}

const TicketTypeMap: Record<string, BadgeMeta["type"]> = {
  WAIT_DISPATCH: "danger",
  ASSIGNED: "primary",
  ARRIVED: "warning",
  REPAIRING: "warning",
  RESTORED: "success",
  CLOSED: "info"
};

const HealthTypeMap: Record<string, BadgeMeta["type"]> = {
  NORMAL: "success",
  WATCH: "warning",
  DEGRADED: "warning",
  DANGEROUS: "danger"
};

const FaultTypeMap: Record<string, BadgeMeta["type"]> = {
  PENDING: "danger",
  TICKETED: "primary",
  MERGED: "info",
  RESTORED: "success",
  CLOSED: "info"
};

const DutyTypeMap: Record<string, BadgeMeta["type"]> = {
  ON_DUTY: "success",
  ON_SITE: "warning",
  OFF_DUTY: "info"
};

const PartTypeMap: Record<string, BadgeMeta["type"]> = {
  PENDING: "danger",
  APPROVED: "success",
  REJECTED: "info",
  RETURNED: "primary"
};

const SeverityTypeMap: Record<string, BadgeMeta["type"]> = {
  NORMAL: "info",
  URGENT: "warning",
  CRITICAL: "danger"
};

/** 统一状态徽标元信息：新增状态值时必须同步本文件（枚举出现位置之一） */
export function resolveBadge(kind: string, value: string): BadgeMeta {
  switch (kind) {
    case "ticket":
      return { text: TicketStatusText[value as keyof typeof TicketStatusText] ?? value, type: TicketTypeMap[value] ?? "info" };
    case "health":
      return {
        text: AssetHealthStatusText[value as keyof typeof AssetHealthStatusText] ?? value,
        type: HealthTypeMap[value] ?? "info",
        color: AssetHealthStatusColor[value as keyof typeof AssetHealthStatusColor]
      };
    case "fault":
      return { text: FaultStatusText[value as keyof typeof FaultStatusText] ?? value, type: FaultTypeMap[value] ?? "info" };
    case "duty":
      return { text: CrewDutyStatusText[value as keyof typeof CrewDutyStatusText] ?? value, type: DutyTypeMap[value] ?? "info" };
    case "part":
      return { text: PartUsageStatusText[value as keyof typeof PartUsageStatusText] ?? value, type: PartTypeMap[value] ?? "info" };
    case "severity":
      return { text: SeverityText[value as keyof typeof SeverityText] ?? value, type: SeverityTypeMap[value] ?? "info" };
    default:
      return { text: value.replace(/_/g, " "), type: "info" };
  }
}
