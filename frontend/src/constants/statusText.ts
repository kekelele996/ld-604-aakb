import { FaultTypeText } from "./FaultType";
import { TicketStatusText } from "./TicketStatus";
import { AssetHealthStatusText } from "./AssetHealthStatus";
import { FaultStatusText } from "./FaultStatus";
import { PartStatusText } from "./PartStatus";
import { CrewDutyStatusText } from "./CrewDutyStatus";
import { SeverityText } from "./Severity";
import { PriorityText } from "./Priority";
import { ReportChannelText } from "./ReportChannel";

/** 集中状态文案，供 utils/formatters 与筛选器统一引用 */
export const STATUS_TEXT = {
  FaultType: FaultTypeText,
  TicketStatus: TicketStatusText,
  AssetHealthStatus: AssetHealthStatusText,
  FaultStatus: FaultStatusText,
  PartStatus: PartStatusText,
  CrewDutyStatus: CrewDutyStatusText,
  Severity: SeverityText,
  Priority: PriorityText,
  ReportChannel: ReportChannelText
};
