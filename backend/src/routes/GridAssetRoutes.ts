import { Router } from "express";
import { gridAssetController } from "../controllers/GridAssetController";
import { rbacRequired } from "../middlewares/rbacMiddleware";
import { Role } from "../constants/Role";

const router = Router();

// 资产台账：四种角色均可查看
router.get("/", rbacRequired(Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR), gridAssetController.list);
router.get("/feeder-lines", gridAssetController.feederLines);
router.get("/:id", gridAssetController.detail);

export default router;
