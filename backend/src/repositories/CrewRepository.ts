import { db } from "./inMemoryDatabase";
import type { Crew } from "../types";

export const crewRepository = {
  findAll: (): Crew[] => db.crews,
  findById: (id: number): Crew | undefined => db.crews.find((row) => row.id === id),
  save: (row: Crew): Crew => {
    const index = db.crews.findIndex((item) => item.id === row.id);
    if (index >= 0) db.crews[index] = row; else db.crews.push(row);
    return row;
  }
};
