import { localDb } from "../mocks/localDb";
import type { Crew } from "../types/Crew";

export async function listCrews(): Promise<Crew[]> {
  return localDb.crews.map((row) => ({ ...row, skill_tags: [...row.skill_tags] }));
}
