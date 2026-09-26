/** 值班状态：值班中可派工；出勤中已有在做工单；休息不可派工 */
export type CrewDutyStatus = "ON_DUTY" | "ON_SITE" | "OFF_DUTY";

export interface Crew {
  id: number;
  name: string;
  leader_id: number;
  leader_name: string;
  /** 技能标签：OUTAGE 抢修 / CABLE 电缆 / TRANSFORMER 变压器 / METER 计量 / LIVE 带电作业 */
  skill_tags: string[];
  duty_status: CrewDutyStatus;
  current_ticket_id: number | null;
  contact_phone: string;
}
