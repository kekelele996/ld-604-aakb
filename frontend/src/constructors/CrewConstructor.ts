import type { Crew } from "../types/Crew";
import { CrewDutyStatus } from "../constants/CrewDutyStatus";

export const createDefaultCrew = (overrides: Partial<Crew> = {}): Crew => ({
  id: 0,
  name: "",
  leader_id: 0,
  leader_name: "",
  skill_tags: "",
  duty_status: CrewDutyStatus.ON_DUTY,
  current_ticket_id: null,
  contact_phone: "",
  ...overrides
});

export const createCrewForm = (): Partial<Crew> => ({
  name: "",
  leader_name: "",
  skill_tags: "",
  duty_status: CrewDutyStatus.ON_DUTY,
  contact_phone: ""
});

export const createCrewResponse = (row: Crew): Crew => createDefaultCrew(row);
