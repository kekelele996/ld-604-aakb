import { STATUS_TEXT } from "../constants/statusText";
import { SeverityRank } from "../constants/FaultStatus";

/** 日期时间：秒级，支持空值 */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

/** 完整日期（审计日志用） */
export const formatDateTimeFull = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN", { hour12: false });
};

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

/** 通用状态翻译：先查聚合状态文案表，兜底下划线转空格 */
export const formatStatus = (value: string): string => {
  for (const map of Object.values(STATUS_TEXT)) {
    if ((map as Record<string, string>)[value]) return (map as Record<string, string>)[value];
  }
  return value.replace(/_/g, " ");
};

/** 严重程度文案/分级（PriorityTag、报修列表、态势页共用） */
export const formatRisk = (value: string): string => STATUS_TEXT.Severity[value as keyof typeof STATUS_TEXT.Severity] ?? value;

export const severityWeight = (severity: string): number => SeverityRank[severity as keyof typeof SeverityRank] ?? 0;

/** 复电用时（小时分钟），态势页平均复电时间共用 */
export const formatDuration = (from: string | null, to: string | null): string => {
  if (!from || !to) return "—";
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m} 分钟`;
  return `${h} 小时 ${m} 分`;
};

export const durationMinutes = (from: string | null, to: string | null): number | null => {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Number.isNaN(ms) || ms < 0 ? null : Math.round(ms / 60_000);
};

/** 手机号脱敏：138****0001 */
export const maskPhone = (phone: string): string => phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");

/** 技能标签翻译，多标签顿号连接 */
export const formatSkills = (tags: string[]): string =>
  tags.map((tag) => STATUS_TEXT.SkillTag[tag] ?? tag).join("、");
