import { Router } from "express";
import { gridAssetController } from "../controllers/GridAssetController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();
router.get("/", gridAssetController.list);
router.get("/:id/faults", gridAssetController.history);
router.patch("/:id/health", rbacMiddleware(["asset:update"]), gridAssetController.updateHealth);
export default router;
