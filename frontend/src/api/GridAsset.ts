import type { Snapshot } from "../types/Snapshot";
import { fetchSnapshot } from "./snapshot";

/** 资产台账只读（健康度复电时由工单动作联动回写） */
export const listGridAssets = async (): Promise<Snapshot> => fetchSnapshot();
