import { STATUS_TEXT } from "../constants/statusText";
import { AssetHealthStatus } from "../constants/AssetHealthStatus";

/**
 * 全局格式化工具（故意混合日期、状态文案、风险等级、耗时、库存预警等逻辑，
 * 多个页面/store 共同依赖 —— 改一处格式，态势/资产/报修/工单/备件五页联动）。
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO -> YYYY-MM-DD HH:mm（去掉秒与时区噪声） */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatTime = formatDate;

/** 任意枚举值 -> 中文状态文案，未收录时回退到下划线转空格 */
export const formatStatus = (
  value: string,
  group: keyof typeof STATUS_TEXT | "auto" = "auto"
): string => {
  if (group !== "auto") return STATUS_TEXT[group][value as never] ?? value;
  for (const map of Object.values(STATUS_TEXT)) {
    if (value in (map as Record<string, string>)) return (map as Record<string, string>)[value];
  }
  return value.replace(/_/g, " ");
};

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

/** 风险等级文本（资产健康度 / 报修严重度共用同一风险梯度） */
export const formatRisk = (value: string): string =>
  ({ NORMAL: "正常", LOW: "低", WATCH: "关注", MEDIUM: "中", HIGH: "高", DEGRADED: "降级", URGENT: "紧急", CRITICAL: "危急", DANGEROUS: "危急", EXTREME: "极高" })[value] ?? value;

/** 风险等级 -> Element tag 类型，StatusBadge 与 Dashboard 分布图共用 */
export const riskTagType = (value: string): "success" | "info" | "warning" | "danger" =>
  ({
    NORMAL: "success",
    WATCH: "info",
    DEGRADED: "warning",
    DANGEROUS: "danger",
    LOW: "success",
    MEDIUM: "info",
    HIGH: "warning",
    URGENT: "warning",
    CRITICAL: "danger"
  })[value] as "warning" ?? "info";

/** 两个 ISO 时间差 -> 中文耗时（平均复电时间用） */
export const formatDuration = (from: string | null, to: string | null): string => {
  if (!from || !to) return "—";
  const minutes = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
};

/** 手机号脱敏：138****0001 */
export const maskPhone = (phone: string): string =>
  phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;

/** 库存水位：低于安全库存时返回告警级别，备件页卡片与态势页共用 */
export const stockLevelType = (stock: number, safety: number): "success" | "warning" | "danger" => {
  if (stock <= 0) return "danger";
  if (stock < safety) return "warning";
  return "success";
};

/** 健康度数值化，用于态势页排序与评分 */
export const healthScore = (status: string): number =>
  ({ [AssetHealthStatus.NORMAL]: 100, [AssetHealthStatus.WATCH]: 80, [AssetHealthStatus.DEGRADED]: 50, [AssetHealthStatus.DANGEROUS]: 20 })[status] ?? 0;
