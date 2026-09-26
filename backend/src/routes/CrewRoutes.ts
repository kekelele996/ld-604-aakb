import { Router } from "express";
import { crewController } from "../controllers/CrewController";
import { rbacRequired, rbacAction } from "../middlewares/rbacMiddleware";
import { Role } from "../constants/Role";

const router = Router();

router.get("/", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), crewController.list);
router.post("/toggle-duty", rbacAction("toggleCrewDuty"), crewController.toggleDuty);

export default router;
