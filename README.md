# 电力配网抢修工单系统（grid-repair）

面向供电所的配网**故障报修、同线路合并、抢修派工、状态流转、备件审批扣库与复电跟踪**平台。四个角色（调度员 / 班组长 / 仓管 / 审计员）看到不同页面与按钮，所有写操作都留审计记录；从报修登记到复电归档的全流程用本地数据即可跑通。

## 快速启动（Docker，首选）

```bash
cp .env.example .env && docker compose up -d
```

启动后：

- 前端：<http://localhost:20104>
- 后端健康检查：<http://localhost:21104/health>

> 任意目录名（含中文目录名）下均可启动；数据库使用命名卷，不绑定宿主机路径。

打开前端后，右上角可切换 **调度员 / 班组长 / 仓管（备件员）/ 审计员** 四种身份，页面按钮随角色显隐；点顶栏「重置数据」可随时恢复初始演示数据。

### 一条主线的演示路径

1. **调度员**：在「故障报修」登记报修 → 对同一条馈线的新报修点「合并重复」→「生成工单」。
2. **调度员**：在「抢修工单」按班组**技能标签 / 值班状态 / 在制任务**派工（不匹配的班组不可选）。
3. **班组长**：依次点「确认到场」「开始处理」→「申请备件」→「确认复电」。
4. **仓管**：在「备件领用」对申请点「批准并出库」——**只有审批通过才扣库存**并生成库存流水；也可驳回/盘点。
5. **复电**时一次性联动：工单→已复电、关联报修（含合并单）→已复电、资产健康→正常、班组→值班待命，并写审计日志。
6. **审计员**：在「操作审计」查看全部写操作记录与库存流水（只读）。

## 本地开发方式

```bash
# 前端（http://localhost:20104，/api 代理到 21104）
cd frontend
npm install
npm run dev

# 后端（http://localhost:21104，接口统一挂在 /api）
cd backend
npm install
npm run dev
```

- 前端只请求相对路径 `/api`，开发期由 Vite 代理（`VITE_API_TARGET` 可改目标），生产由 Nginx 反代。
- 后端在**后端离线时前端自动回退到本地内存引擎**（`frontend/src/api/engine.ts`），规则与后端 `backend/src/services/engine.ts` 完全镜像，纯前端 `npm run dev` 也能跑通全流程。
- 前端自检：`npm test`（业务引擎全流程 + 六页面 SSR 渲染冒烟）；`npm run build` 含 `vue-tsc` 类型检查。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia + vue-router + ECharts |
| 后端 | Node.js + Express + TypeScript（分层 routes/controllers/services/repositories） |
| 数据库 | MySQL 8.0（Prisma schema + `database/init.sql`；演示运行期为内存种子库） |
| 认证 / 授权 | JWT（`Authorization: Bearer`）+ 本地演示角色头 + RBAC 动作矩阵 |
| 部署 | Docker Compose（db / backend / frontend 三容器 + 命名卷 + healthcheck） |

## 目录结构

```text
.
├── docker-compose.yml         # 顶层 name: grid-repair；容器名统一前缀
├── .env.example / .env        # 端口、数据库凭据、JWT 密钥
├── database/init.sql          # MySQL 8.0 建表脚本（8 张表，容器首启自动执行）
├── frontend/
│   ├── Dockerfile / nginx.conf
│   └── src/
│       ├── api/               # 按实体分文件 + http/snapshot 门面 + engine 本地引擎
│       ├── stores/            # authStore、dataStore + 每实体一个 store
│       ├── types/             # 实体/快照/审计类型（枚举在 types 下重复声明入口）
│       ├── constants/         # 枚举、权限矩阵、错误码/错误消息、日志模板、状态文案
│       ├── constructors/      # 每实体的默认对象 / 表单 / 响应构造器
│       ├── components/common/ # StatusBadge/PriorityTag/AssetTree/CrewCard/TimelineList/ApprovalPanel/StatCard/EmptyState
│       ├── hooks/             # useTicketFlow / useCrewAvailability / usePagination / runAction
│       ├── pages/             # Dashboard/Assets/Faults/Tickets/Parts + Audit
│       ├── router/            # 路由表 + 守卫（RBAC）
│       ├── utils/formatters.ts
│       └── mocks/             # 本地种子数据（禁止第三方 API）
└── backend/
    ├── Dockerfile
    ├── prisma/schema.prisma
    └── src/
        ├── routes/            # 每实体一个路由文件 + AuditRoutes
        ├── controllers/       # 每实体一个控制器 + Action/Snapshot 控制器
        ├── services/          # 每实体一个服务 + engine 业务规则
        ├── repositories/      # 内存仓储（生产可替换为 Prisma 事务）
        ├── models/            # 实体模型
        ├── middlewares/       # auth / rbac / auditLog / requestLogger / rateLimit / errorHandler
        ├── constants/         # 枚举、动作-角色矩阵、错误码/错误消息、日志模板
        ├── constructors/      # 请求/响应 DTO 工厂
        ├── types/             # Payload 类型、Express Request 扩展
        ├── utils/formatters.ts
        └── config/env.ts
```

## 四角色权限差异（RBAC）

| 动作 | 调度员 DISPATCHER | 班组长 LEADER | 仓管 WAREHOUSE | 审计员 AUDITOR |
|---|:-:|:-:|:-:|:-:|
| 登记报修 / 合并重复 / 生成工单 | ✅ | — | — | — |
| 派工（技能+值班校验） | ✅ | — | — | — |
| 到场 / 处理 / 复电 / 归档 | — | ✅ | — | — |
| 申请备件 / 确认消耗 / 归还 | — | ✅ | — | — |
| 班组值班切换 | — | ✅ | — | — |
| 备件**审批**（此刻才扣库存）/ 驳回 / 盘点 | — | — | ✅ | — |
| 查看全部页面与审计日志 | ✅ | ✅ | ✅ | ✅（只读） |

权限矩阵：前端 `constants/permissions.ts`（控制按钮显隐 + 路由守卫），后端 `constants/Role.ts` 的 `ACTION_ROLES` + `middlewares/rbacMiddleware.ts`（接口强校验），两侧动作名一致。

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | Compose 项目名与容器名前缀 | `grid-repair` |
| `FRONTEND_PORT` | 前端宿主机端口（容器内 80） | `20104` |
| `BACKEND_PORT` | 后端宿主机端口（容器内 3000） | `21104` |
| `DB_PORT` | MySQL 宿主机端口（容器内 3306） | `33060` |
| `DB_NAME / DB_USER / DB_PASSWORD` | 数据库名与凭据 | `app_db / app_user / app_password` |
| `JWT_SECRET` | JWT 签名密钥 | `local-dev-secret` |

## Docker 部署说明

- `docker-compose.yml` 顶层 `name: grid-repair`，不写 `version`；所有 `container_name` 带 `${COMPOSE_PROJECT_NAME:-grid-repair}` 前缀。
- 三服务：`db`（MySQL 8.0，带 healthcheck，`depends_on: condition: service_healthy`）、`backend`（带 `/health` healthcheck，等待 db 健康）、`frontend`（Nginx 多阶段构建，等待 backend 健康）。
- 数据保存在命名卷 `grid-repair_db_data`，**不绑定挂载**，中文目录名也不会出问题。
- 前端 Nginx：`location /api/ { proxy_pass http://backend:3000/api/; }`，SPA 回退 `try_files $uri $uri/ /index.html;`。
- 常见问题：
  - 端口占用：改 `.env` 中 `FRONTEND_PORT/BACKEND_PORT/DB_PORT` 后 `docker compose up -d`。
  - 重置数据：`docker compose down -v` 删除命名卷后重新启动；或在页面顶栏点「重置数据」。
  - 前端能打开但接口 401：后端默认要求角色头/JWT，前端已自动携带；直接 curl 请加 `-H "x-role: DISPATCHER"`。

## 枚举 / 常量出现位置清单

新增任一枚举值都必须同步：**常量定义 → 类型 → 构造器默认值 → 日志模板/错误消息 → 筛选器 → 展示组件 → 后端同名枚举/引擎 → 种子数据 → README**。

### FaultType（OUTAGE / VOLTAGE_LOW / TRIP / EQUIPMENT_DAMAGE / SAFETY_RISK）

- 前端常量：`frontend/src/constants/FaultType.ts`（枚举 + 中文文案 + 筛选 Options）
- 前端类型：`frontend/src/types/FaultType.ts`、`types/FaultReport.ts`
- 构造器默认值：`constructors/FaultReportConstructor.ts`
- 日志模板/错误：`constants/logTemplates.ts`（FaultReport.CREATE 渲染 faultType）、`constants/errorMessages.ts`
- 聚合文案：`constants/statusText.ts`
- 筛选器：`pages/FaultsPage.vue`（故障类型下拉，用 `FaultTypeOptions`）
- 展示：`components/common/StatusBadge.vue`、Faults/Assets/Tickets 表格中的 `FaultTypeText`
- 数据：`mocks/seedData.ts`
- 后端镜像：`backend/src/constants/FaultType.ts`、`models/FaultReport.ts`、`constructors/FaultReportDtoFactory.ts`、`services/engine.ts`（登记/合并校验）、`seed.ts`、`utils/formatters.ts`、`database/init.sql`（fault_type 列）

### TicketStatus（WAIT_DISPATCH / ASSIGNED / ARRIVED / REPAIRING / RESTORED / CLOSED）

- 前端常量：`frontend/src/constants/TicketStatus.ts`（枚举 + 文案 + **TicketStatusFlow 流转顺序**）
- 前端类型：`types/TicketStatus.ts`、`types/RepairTicket.ts`
- 构造器：`constructors/RepairTicketConstructor.ts`（默认 WAIT_DISPATCH、派工表单）
- 日志/错误：`logTemplates.ts`（DISPATCH/STATUS_CHANGE/RESTORE/CLOSE）、`errorMessages.ts`（INVALID_TRANSITION、TICKET_NOT_ACTIVE）
- 流转逻辑：`hooks/useTicketFlow.ts`、`api/engine.ts`（advance/复电联动）
- 筛选器：`pages/TicketsPage.vue`、`pages/DashboardPage.vue`（抢修进度步骤条）
- 展示：`StatusBadge.vue`（每状态独立配色）、`TimelineList.vue` 时间线
- 后端镜像：`backend/src/constants/TicketStatus.ts`（含 `TICKET_STATUS_FLOW`）、`middlewares/rbacMiddleware.ts`（状态动作授权）、`services/engine.ts`、`controllers/RepairTicketController.ts`、`routes/RepairTicketRoutes.ts`、`database/init.sql`（status 列）

### AssetHealthStatus（NORMAL / WATCH / DEGRADED / DANGEROUS）

- 前端常量：`frontend/src/constants/AssetHealthStatus.ts`（枚举 + 文案 + Options）
- 前端类型：`types/AssetHealthStatus.ts`、`types/GridAsset.ts`
- 构造器：`constructors/GridAssetConstructor.ts`
- 日志/错误：`logTemplates.ts`（GridAsset.STATUS_CHANGE）、`errorMessages.ts`（ASSET_NOT_FOUND）
- 格式化：`utils/formatters.ts`（`riskTagType/healthScore`）
- 筛选器：`pages/AssetsPage.vue`（健康状态下拉）、`AssetTree.vue` 线路树告警角标
- 展示：`StatusBadge.vue`、Dashboard 健康分布 ECharts
- **业务回写**：`api/engine.ts` 的 `restoreTicket` 在复电时把关联资产统一置为 NORMAL
- 后端镜像：`backend/src/constants/AssetHealthStatus.ts`、`services/engine.ts`（复电联动）、`seed.ts`、`utils/formatters.ts`、`database/init.sql`（health_status 列）

> 另有 `FaultStatus / PartStatus / CrewDutyStatus / Severity / Priority / ReportChannel / Role`，分布在 `constants/`、`types/`、各构造器、日志模板、页面筛选与 `StatusBadge` 中，后端 `constants/Role.ts` 集中镜像。

## 为什么改一处会牵一发动全身

- **一个动作改五张表**：复电在单个引擎函数里同时更新工单、全部关联报修（含同线路合并单）、资产健康度、班组值班状态，并向审计日志追加多条记录；前端快照整表替换、后端内存仓储整体提交，语义集中但文件横跨 `engine/service/store/页面/日志模板`。
- **枚举前后端双份镜像**：状态文案、流转顺序、风险配色散落在 constants、formatters、StatusBadge、筛选器、后端引擎与 init.sql，加一个状态至少改 8 处。
- **错误码 / 错误消息 / 日志模板独立成文件**：service 抛 `BusinessError(code, params)`，controller 与全局 errorHandler 分别包装；每个写动作都经 `renderLog(entity, action, params)` 渲染中文日志，字段一变模板与调用处都要跟。
- **构造器收口默认结构**：页面与 store 禁止散写默认对象，新增字段必须改 `constructors/*` 与后端 `constructors/*DtoFactory`。
- **RBAC 双层**：按钮显隐走前端权限矩阵，接口走后端动作-角色矩阵，动作名必须两边一致。
- **格式化工具被多页共用**：`utils/formatters.ts` 混合日期、状态文案、耗时、手机号脱敏、库存水位，改一处影响态势/资产/报修/工单/备件五个页面。

## License

MIT
