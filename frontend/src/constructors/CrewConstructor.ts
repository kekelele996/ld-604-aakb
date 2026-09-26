import type { Crew } from "../types/Crew";

export const createDefaultCrew = (overrides: Partial<Crew> = {}): Crew => ({
  id: 0,
  name: "",
  leader_id: 0,
  leader_name: "",
  skill_tags: [],
  duty_status: "ON_DUTY",
  current_ticket_id: null,
  contact_phone: "",
  ...overrides
});

export const createCrewForm = (): Partial<Crew> => ({
  name: "",
  leader_name: "",
  skill_tags: [],
  duty_status: "ON_DUTY",
  contact_phone: ""
});

export const createCrewResponse = (row: Crew) => ({ ...row });
