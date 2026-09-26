import { dataStore } from "./InMemoryStore";
import type { Crew } from "../models/Crew";

export const crewRepository = {
  findAll(): Crew[] {
    return dataStore.getSnapshot().crews;
  },
  findById(id: number): Crew | undefined {
    return dataStore.getSnapshot().crews.find((c) => c.id === id);
  }
};
