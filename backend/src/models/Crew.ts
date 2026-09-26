import type { Crew } from "../types";
export const isDispatchable = (crew: Crew): boolean => crew.duty_status === "ON_DUTY" && crew.current_ticket_id === null;
export const hasSkill = (crew: Crew, skill: string): boolean => crew.skill_tags.includes(skill);
