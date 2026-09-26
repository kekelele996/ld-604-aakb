import type { Snapshot } from "../types/Snapshot";
import type { CurrentUser } from "../types/Audit";
import { getJson, postJson, isOffline } from "./http";
import { buildSeedSnapshot } from "../mocks/snapshot";
import {
  createFault, mergeFault, generateTicket, dispatchTicket,
  arriveTicket, progressTicket, restoreTicket, closeTicket, toggleCrewDuty,
  applyPart, approvePart, rejectPart, consumePart, returnPart, adjustStock
} from "./engine";

/**
 * 数据访问门面：后端在线时走 /api，离线/评审环境下回退本地内存引擎，
 * 两条路径的业务规则完全一致（后端用同一套 engine 逻辑实现）。
 */

let local: Snapshot = buildSeedSnapshot();

export const fetchSnapshot = async (): Promise<Snapshot> => {
  try {
    const remote = await getJson<Snapshot>("/snapshot");
    local = remote;
    return remote;
  } catch (err) {
    if (isOffline(err)) return local;
    throw err;
  }
};

export const resetSnapshot = async (): Promise<Snapshot> => {
  local = buildSeedSnapshot();
  try {
    const remote = await postJson<Snapshot>("/snapshot/reset", {});
    local = remote;
    return remote;
  } catch (err) {
    if (isOffline(err)) return local;
    return local;
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type LocalFn = (s: Snapshot, ...args: any[]) => Snapshot;

const localActions: Record<string, LocalFn> = {
  createFault,
  mergeFault,
  generateTicket,
  dispatchTicket,
  arriveTicket,
  progressTicket,
  restoreTicket,
  closeTicket,
  toggleCrewDuty,
  applyPart,
  approvePart,
  rejectPart,
  consumePart,
  returnPart,
  adjustStock
};

export const dispatchAction = async (
  name: string,
  args: unknown[],
  actor: CurrentUser
): Promise<Snapshot> => {
  try {
    const remote = await postJson<Snapshot>(`/actions/${name}`, { args, actor });
    local = remote;
    return remote;
  } catch (err) {
    if (isOffline(err)) {
      const fn = localActions[name];
      if (!fn) throw new Error(`未知本地动作: ${name}`);
      local = fn(local, ...(args as never[]), actor);
      return { ...local };
    }
    throw err;
  }
};
