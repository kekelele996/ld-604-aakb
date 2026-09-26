import { Router } from "express";
import { repairTicketController } from "../controllers/RepairTicketController";
import { rbacRequired, rbacAction } from "../middlewares/rbacMiddleware";
import { Role } from "../constants/Role";

const router = Router();

router.get("/", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), repairTicketController.list);
router.post("/dispatch", rbacAction("dispatchTicket"), repairTicketController.dispatch);
router.post("/arrive", rbacAction("arriveTicket"), repairTicketController.arrive);
router.post("/progress", rbacAction("progressTicket"), repairTicketController.progress);
router.post("/restore", rbacAction("restoreTicket"), repairTicketController.restore);
router.post("/close", rbacAction("closeTicket"), repairTicketController.close);

export default router;
