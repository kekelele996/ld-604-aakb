import { Router } from "express";
import { faultReportController } from "../controllers/FaultReportController";
import { rbacRequired, rbacAction } from "../middlewares/rbacMiddleware";
import { Role } from "../constants/Role";

const router = Router();

router.get("/", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), faultReportController.list);
router.get("/:id/duplicates", faultReportController.duplicates);
router.post("/", rbacAction("createFault"), faultReportController.register);
router.post("/merge", rbacAction("mergeFault"), faultReportController.merge);
router.post("/generate-ticket", rbacAction("generateTicket"), faultReportController.generate);

export default router;
