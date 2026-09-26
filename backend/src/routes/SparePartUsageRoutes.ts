import { Router } from "express";
import { sparePartUsageController } from "../controllers/SparePartUsageController";
import { rbacRequired, rbacAction } from "../middlewares/rbacMiddleware";
import { Role } from "../constants/Role";

const router = Router();

router.get("/usages", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), sparePartUsageController.listUsages);
router.get("/stocks", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), sparePartUsageController.listStocks);
router.get("/txns", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), sparePartUsageController.listTxns);
router.post("/apply", rbacAction("applyPart"), sparePartUsageController.apply);
router.post("/approve", rbacAction("approvePart"), sparePartUsageController.approve);
router.post("/reject", rbacAction("rejectPart"), sparePartUsageController.reject);
router.post("/consume", rbacAction("consumePart"), sparePartUsageController.consume);
router.post("/return", rbacAction("returnPart"), sparePartUsageController.returnPart);
router.post("/adjust-stock", rbacAction("adjustStock"), sparePartUsageController.adjustStock);

export default router;
