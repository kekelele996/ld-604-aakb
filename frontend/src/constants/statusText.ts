import { FaultTypeText } from "./FaultType";
import { TicketStatusText } from "./TicketStatus";
import { AssetHealthStatusText } from "./AssetHealthStatus";
import { FaultStatusText, SeverityText, ReportChannelText } from "./FaultStatus";
import { CrewDutyStatusText, SkillTagText } from "./CrewDutyStatus";
import { PartUsageStatusText } from "./PartUsageStatus";
import { RoleText } from "../types/Role";

/** 全量状态文案聚合，供 formatters / StatusBadge 兜底翻译 */
export const STATUS_TEXT = {
  FaultType: FaultTypeText,
  TicketStatus: TicketStatusText,
  AssetHealthStatus: AssetHealthStatusText,
  FaultStatus: FaultStatusText,
  Severity: SeverityText,
  ReportChannel: ReportChannelText,
  CrewDutyStatus: CrewDutyStatusText,
  SkillTag: SkillTagText,
  PartUsageStatus: PartUsageStatusText,
  Role: RoleText
};
