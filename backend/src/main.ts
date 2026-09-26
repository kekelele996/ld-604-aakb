import express from "express";
import cors from "cors";
import { config } from "./config/env";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware";
import { authMiddleware } from "./middlewares/authMiddleware";
import { auditLogMiddleware } from "./middlewares/auditLogMiddleware";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";
import authRoutes from "./routes/AuthRoutes";
import gridAssetRoutes from "./routes/GridAssetRoutes";
import faultReportRoutes from "./routes/FaultReportRoutes";
import repairTicketRoutes from "./routes/RepairTicketRoutes";
import crewRoutes from "./routes/CrewRoutes";
import sparePartUsageRoutes from "./routes/SparePartUsageRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "grid-repair", storage: config.storage }));
app.use("/api/auth", authRoutes);

// 业务路由统一 JWT 认证 + 写操作审计埋点；具体动作权限在各路由 rbacMiddleware 校验
app.use("/api", authMiddleware, auditLogMiddleware);
app.use("/api/grid-assets", gridAssetRoutes);
app.use("/api/fault-reports", faultReportRoutes);
app.use("/api/repair-tickets", repairTicketRoutes);
app.use("/api/crews", crewRoutes);
app.use("/api/spare-part-usages", sparePartUsageRoutes);

app.use(errorHandlerMiddleware);

app.listen(config.port, () => {
  console.log(`grid-repair backend listening on ${config.port} (storage=${config.storage})`);
});
