import type { CrewDutyStatus } from "../constants/CrewDutyStatus";

export interface Crew {
  id: number;
  name: string;
  leader_id: number;
  leader_name: string;
  /** 技能标签，逗号分隔；派工时需覆盖故障所需技能 */
  skill_tags: string;
  duty_status: CrewDutyStatus;
  current_ticket_id: number | null;
  contact_phone: string;
}
