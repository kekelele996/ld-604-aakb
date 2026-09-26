import type { Response, NextFunction } from "express";
import { dataStore } from "../repositories/InMemoryStore";
import { ENGINE_ACTIONS, type EngineActionName } from "../services/engine";
import { ACTION_ROLES } from "../constants/Role";
import { BusinessError } from "../constants/errorMessages";
import type { AuthedRequest } from "../types/express";
import type { CurrentUser } from "../models/Audit";

/**
 * 统一业务动作入口 POST /api/actions/:name
 * 前端五个实体 api 最终都收敛到这里；动作名同时用于 RBAC 校验，
 * service 层再按实体拆分，保证小改动也能跨多层文件。
 */
export const actionController = {
  dispatch(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const actor = (req.user ?? req.body?.actor) as CurrentUser | undefined;
      const name = req.params.name as EngineActionName;
      const fn = ENGINE_ACTIONS[name];
      if (!fn) throw new BusinessError("UNKNOWN_ACTION", { name }, 404);
      if (actor) {
        const allowed = ACTION_ROLES[name];
        if (allowed && !allowed.includes(actor.role)) {
          throw new BusinessError("RBAC_DENIED", {}, 403);
        }
      } else {
        throw new BusinessError("AUTH_REQUIRED", {}, 401);
      }
      const args = Array.isArray(req.body?.args) ? req.body.args : [];
      // 业务引擎签名：(snapshot, ...args, actor)
      const nextSnapshot = (fn as (s: unknown, ...rest: unknown[]) => unknown)(
        dataStore.getSnapshot(),
        ...args,
        actor
      );
      dataStore.setSnapshot(nextSnapshot as never);
      res.json(dataStore.getSnapshot());
    } catch (err) {
      next(err);
    }
  }
};
