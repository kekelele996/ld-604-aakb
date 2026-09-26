import type { Snapshot } from "../types/Snapshot";
import type { CurrentUser } from "../types/Audit";
import { dispatchAction, fetchSnapshot } from "./snapshot";

export const listCrews = async (): Promise<Snapshot> => fetchSnapshot();

/** 班组长切换值班/休班 */
export const toggleCrewDuty = (crewId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("toggleCrewDuty", [crewId], actor);
