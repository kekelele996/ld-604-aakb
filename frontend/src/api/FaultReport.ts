import type { Snapshot } from "../types/Snapshot";
import type { CurrentUser } from "../types/Audit";
import type { FaultFormInput } from "./engine";
import { dispatchAction, fetchSnapshot } from "./snapshot";

export type { FaultFormInput };

export const listFaultReports = async (): Promise<Snapshot> => fetchSnapshot();

/** 登记报修 */
export const createFaultReport = (form: FaultFormInput, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("createFault", [form], actor);

/** 同线路重复报修合并 */
export const mergeFaultReport = (id: number, masterId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("mergeFault", [id, masterId], actor);

/** 合并/单张报修生成工单 */
export const generateTicketFromFault = (masterFaultId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("generateTicket", [masterFaultId], actor);
