import { Router } from "express";
import { sparePartUsageController } from "../controllers/SparePartUsageController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();
router.get("/parts", sparePartUsageController.listParts);
router.get("/ledgers", sparePartUsageController.listLedgers);
router.get("/audit-logs", rbacMiddleware(["audit:view"]), sparePartUsageController.listAuditLogs);
router.get("/", sparePartUsageController.listUsages);
router.post("/", rbacMiddleware(["part:apply"]), sparePartUsageController.apply);
router.post("/:id/approve", rbacMiddleware(["part:approve"]), sparePartUsageController.approve);
router.post("/:id/reject", rbacMiddleware(["part:reject"]), sparePartUsageController.reject);
router.post("/:id/return", rbacMiddleware(["part:return"]), sparePartUsageController.returnPart);
router.post("/parts/:id/adjust", rbacMiddleware(["stock:adjust"]), sparePartUsageController.adjustStock);
export default router;
