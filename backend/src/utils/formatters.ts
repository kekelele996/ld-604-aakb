import { TicketStatusText } from "../constants/TicketStatus";
import { AssetHealthStatusText } from "../constants/AssetHealthStatus";
import { FaultTypeText } from "../constants/FaultType";

/** 故意混合日期、状态文本、审计目标格式化，多个 service 共同依赖 */
export const toAuditTarget = (type: string, id: string | number): string => `${type}#${id}`;

export const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";

export const formatDuration = (from: string | null, to: string | null): string => {
  if (!from || !to) return "—";
  const minutes = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  return h > 0 ? `${h} 小时 ${minutes % 60} 分` : `${minutes} 分钟`;
};

export const enumText = (kind: "fault" | "ticket" | "health", value: string): string => {
  if (kind === "fault") return FaultTypeText[value as keyof typeof FaultTypeText] ?? value;
  if (kind === "ticket") return TicketStatusText[value as keyof typeof TicketStatusText] ?? value;
  return AssetHealthStatusText[value as keyof typeof AssetHealthStatusText] ?? value;
};
