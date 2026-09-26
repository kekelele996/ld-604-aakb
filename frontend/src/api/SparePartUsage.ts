import type { Snapshot } from "../types/Snapshot";
import type { CurrentUser } from "../types/Audit";
import { dispatchAction, fetchSnapshot } from "./snapshot";

export const listSparePartUsages = async (): Promise<Snapshot> => fetchSnapshot();

/** 班组长申请备件（不扣库存） */
export const applySparePart = (
  ticketId: number,
  partCode: string,
  quantity: number,
  actor: CurrentUser
): Promise<Snapshot> => dispatchAction("applyPart", [ticketId, partCode, quantity], actor);

/** 仓管审批通过 —— 审批后才扣库存 */
export const approveSparePart = (usageId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("approvePart", [usageId], actor);

export const rejectSparePart = (usageId: number, reason: string, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("rejectPart", [usageId, reason], actor);

/** 班组长确认消耗 */
export const consumeSparePart = (usageId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("consumePart", [usageId], actor);

/** 班组长归还，库存回补 */
export const returnSparePart = (usageId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("returnPart", [usageId], actor);

/** 仓管盘点 */
export const adjustStock = (partCode: string, newStock: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("adjustStock", [partCode, newStock], actor);
