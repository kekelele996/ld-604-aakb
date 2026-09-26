import express from "express";
import cors from "cors";
import { config } from "./config/env";
import { authMiddleware } from "./middlewares/authMiddleware";
import { auditLogMiddleware } from "./middlewares/auditLogMiddleware";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";
import { rbacRequired } from "./middlewares/rbacMiddleware";
import { Role } from "./constants/Role";
import gridAssetRoutes from "./routes/GridAssetRoutes";
import faultReportRoutes from "./routes/FaultReportRoutes";
import repairTicketRoutes from "./routes/RepairTicketRoutes";
import crewRoutes from "./routes/CrewRoutes";
import sparePartUsageRoutes from "./routes/SparePartUsageRoutes";
import auditRoutes from "./routes/AuditRoutes";
import { snapshotController } from "./controllers/SnapshotController";
import { actionController } from "./controllers/ActionController";

const app = express();
app.set("trust proxy", true);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// 横切中间件链：请求日志 → 限流 → 认证 → 审计
app.use(requestLoggerMiddleware);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "grid-repair", time: new Date().toISOString() }));
app.use(rateLimitMiddleware);
app.use(authMiddleware);
app.use(auditLogMiddleware);

// 前端五页共享的全量快照与统一动作入口
app.get("/api/snapshot", snapshotController.get);
app.post("/api/snapshot/reset", rbacRequired(Role.DISPATCHER), snapshotController.reset);
app.post("/api/actions/:name", actionController.dispatch);

// 按实体拆分的 REST 路由
app.use("/api/grid-asset", gridAssetRoutes);
app.use("/api/fault-report", faultReportRoutes);
app.use("/api/repair-ticket", repairTicketRoutes);
app.use("/api/crew", crewRoutes);
app.use("/api/spare-part-usage", sparePartUsageRoutes);
app.use("/api/audit", auditRoutes);

// service/controller 分层抛出的异常在此统一收口
app.use(errorHandlerMiddleware);

app.listen(config.port, () => {
  console.log(`grid-repair backend listening on ${config.port} (db=${config.db.host}:${config.db.port}/${config.db.name})`);
});
