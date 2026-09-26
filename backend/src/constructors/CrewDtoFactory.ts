import type { Crew } from "../types";
export const toCrewDto = (row: Crew): Crew => ({ ...row, skill_tags: [...row.skill_tags] });
