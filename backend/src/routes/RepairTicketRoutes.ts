import { Router } from "express";
import { repairTicketController } from "../controllers/RepairTicketController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();
router.get("/", repairTicketController.list);
router.get("/:id", repairTicketController.detail);
router.post("/:id/dispatch", rbacMiddleware(["ticket:dispatch"]), repairTicketController.dispatch);
router.post("/:id/advance", rbacMiddleware(["ticket:advance"]), repairTicketController.advance);
export default router;
