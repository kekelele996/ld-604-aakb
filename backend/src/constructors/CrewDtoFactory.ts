import type { Crew } from "../models/Crew";
import { CrewDutyStatus } from "../constants/Role";

export const createCrewDto = (body: Partial<Crew> = {}): Crew => ({
  id: body.id ?? 0,
  name: body.name ?? "",
  leader_id: body.leader_id ?? 0,
  leader_name: body.leader_name ?? "",
  skill_tags: body.skill_tags ?? "",
  duty_status: body.duty_status ?? CrewDutyStatus.ON_DUTY,
  current_ticket_id: body.current_ticket_id ?? null,
  contact_phone: body.contact_phone ?? ""
});

export const toCrewResponse = (row: Crew): Crew => ({ ...row });
