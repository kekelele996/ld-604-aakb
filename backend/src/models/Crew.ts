import type { CrewDutyStatus } from "../constants/Role";

export interface Crew {
  id: number;
  name: string;
  leader_id: number;
  leader_name: string;
  skill_tags: string;
  duty_status: CrewDutyStatus;
  current_ticket_id: number | null;
  contact_phone: string;
}
