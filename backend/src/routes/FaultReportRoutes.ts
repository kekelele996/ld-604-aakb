import { Router } from "express";
import { faultReportController } from "../controllers/FaultReportController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();
router.get("/", faultReportController.list);
router.post("/", rbacMiddleware(["fault:register"]), faultReportController.register);
router.post("/merge", rbacMiddleware(["fault:merge"]), faultReportController.merge);
router.post("/:id/ticket", rbacMiddleware(["ticket:create"]), faultReportController.createTicket);
export default router;
