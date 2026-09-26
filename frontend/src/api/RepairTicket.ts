import type { Snapshot } from "../types/Snapshot";
import type { CurrentUser } from "../types/Audit";
import type { Priority } from "../constants/Priority";
import { dispatchAction, fetchSnapshot } from "./snapshot";

export const listRepairTickets = async (): Promise<Snapshot> => fetchSnapshot();

/** 调度员派工（技能/值班校验在 engine 与后端 RBAC 后执行） */
export const dispatchTicket = (
  ticketId: number,
  teamId: number,
  priority: Priority,
  actor: CurrentUser
): Promise<Snapshot> => dispatchAction("dispatchTicket", [ticketId, teamId, priority], actor);

export const arriveTicket = (ticketId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("arriveTicket", [ticketId], actor);

export const progressTicket = (ticketId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("progressTicket", [ticketId], actor);

/** 复电：工单/报修/资产/班组一次联动 */
export const restoreTicket = (ticketId: number, remark: string, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("restoreTicket", [ticketId, remark], actor);

export const closeTicket = (ticketId: number, actor: CurrentUser): Promise<Snapshot> =>
  dispatchAction("closeTicket", [ticketId], actor);
