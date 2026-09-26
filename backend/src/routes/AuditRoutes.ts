import { Router } from "express";
import { dataStore } from "../repositories/InMemoryStore";
import { rbacRequired } from "../middlewares/rbacMiddleware";
import { Role } from "../constants/Role";

const router = Router();

/** 审计日志 + 库存流水：四种角色可查（审计员核心页面），只读 */
router.get("/logs", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), (_req, res) => {
  res.json(dataStore.getSnapshot().auditLogs);
});
router.get("/stock-txns", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), (_req, res) => {
  res.json(dataStore.getSnapshot().stockTxns);
});

export default router;
