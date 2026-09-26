# 电力配网抢修工单系统 grid-repair

面向供电所的**配网故障报修、同线路重复合并、抢修派工、状态流转、备件审批扣库存与复电联动**全流程平台。调度员、班组长、仓管（备件员）、审计员四种角色看到的页面与可执行操作不同，所有写操作均留痕。前端五个页面使用**本地种子数据**即可完整跑通「登记 → 复电」全链路，无需第三方 API。

## 快速启动（Docker Compose 一键部署）

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：

| 服务 | 地址 |
|---|---|
| 前端（五个业务页面） | http://localhost:20104 |
| 后端健康检查 | http://localhost:21104/health |
| MySQL（仅建表参照，默认后端用本地内存库） | 宿主机 127.0.0.1:33060 |

> 默认 `STORAGE=memory`：后端启动即载入与前端一致的本地种子数据，重启容器数据重置。
> 页面右上角「重置数据」可随时把前端内存库恢复到种子状态。

## 四角色演示账号（RBAC）

| 用户名 | 密码 | 角色 | 可执行的关键写操作 |
|---|---|---|---|
| `dispatcher` | `123456` | 调度员 | 登记报修、合并重复、生成工单、派工、班组值班切换 |
| `leader` | `123456` | 班组长 | 到场/处理/复电确认、备件申请、余料归还、资产状态更新 |
| `warehouse` | `123456` | 仓管（备件员） | 备件审批通过/驳回、库存盘点调整 |
| `auditor` | `123456` | 审计员 | 只读：浏览全部页面与操作审计日志 |

前端通过左下角角色切换器即时切换视角（模拟 JWT 登录态）；后端 `POST /api/auth/login` 签发真实 JWT，也可用 `Authorization: Bearer dev:<ROLE>` 占位令牌联调。

## 业务全流程（五个页面如何串起来）

1. **故障报修页（调度员）**：登记报修 → 按 `FaultType` 自动分级并冲击资产健康档位；系统检测**同一馈线**未结报修并提示，调度员执行「合并重复」→ 对主单「生成工单」。
2. **抢修工单页（调度员 → 班组长）**：调度员派工时按**班组技能 + 值班状态 + 在做工单**三项校验，只有值班中且技能匹配的班组可派；派工联动班组置为「出勤中」。班组长依次推进 **已派工 → 已到场 → 处理中 → 已复电 → 已归档**。
3. **备件领用页（班组长 → 仓管）**：班组长提交备件申请（只建 PENDING 单、**不动库存**）；**仓管审批通过的那一刻才扣减库存**并写库存流水，驳回不动库存，余料归还回补库存。
4. **复电三联动**：班组长填写复电结论确认复电时，同一事务语义内同步——① 主报修单及合并单状态更新（合并单保持「已合并」，主单「已复电」）；② 工单关联资产健康状态恢复 `NORMAL`；③ 班组释放回「值班中」、清空在做工单。
5. **态势 / 资产页**：待派工数、在修数、平均复电时间、班组状态、资产健康告警、资产历史故障（含合并进来的重复报修）实时联动。

所有写操作（登记、合并、派工、流转、审批、扣库存、盘点、状态变更）都写入审计日志，可在右上角「审计日志」抽屉中按对象/动作筛选。

## 本地开发方式

```bash
# 前端（Vue 3 + TS + Vite，默认端口 20104，直接使用本地种子数据）
cd frontend
npm install
npm run dev        # http://localhost:20104
npm run build      # vue-tsc 类型检查 + 产物构建
npx tsx scripts/flow-check.ts   # 前端服务层全流程断言（43 项）
npm test                        # 五页挂载 + 应用外壳 + RBAC + store 全链路（18 项，vitest + happy-dom）

# 后端（Express + TS，默认端口 3000 / Compose 映射 21104）
cd backend
npm install
npm run dev        # tsx watch 热更新
npm run build && npm start
npm run flow       # 后端服务层全流程断言（31 项）
```

后端接口统一挂在 `/api`，前端 Nginx 已配置 `location /api/` 反代到 `http://backend:3000/`，代码中不出现硬编码 localhost。

## 主要 HTTP 接口（JWT 鉴权 + RBAC）

| 方法 | 路径 | 角色 | 说明 |
|---|---|---|---|
| POST | `/api/auth/login` | 公开 | 换取 JWT |
| GET | `/api/grid-assets`、`/api/grid-assets/:id/faults` | 全部 | 资产台账 / 历史故障 |
| PATCH | `/api/grid-assets/:id/health` | 班组长 | 健康状态变更（留痕） |
| POST | `/api/fault-reports` | 调度员 | 登记报修（自动分级） |
| POST | `/api/fault-reports/merge` | 调度员 | 同线路重复报修合并 |
| POST | `/api/fault-reports/:id/ticket` | 调度员 | 合并后生成工单 |
| POST | `/api/repair-tickets/:id/dispatch` | 调度员 | 派工（技能/值班校验） |
| POST | `/api/repair-tickets/:id/advance` | 班组长 | 到场/处理/复电/归档状态机 |
| POST | `/api/spare-part-usages` | 班组长 | 备件申请（不扣库存） |
| POST | `/api/spare-part-usages/:id/approve` `/reject` | 仓管 | 审批，通过才扣库存 |
| POST | `/api/spare-part-usages/:id/return` | 班组长 | 余料归还回补 |
| POST | `/api/spare-part-usages/parts/:id/adjust` | 仓管 | 盘点调整（写流水） |
| GET | `/api/spare-part-usages/audit-logs` | 审计员 | 审计日志只读 |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia |
| 后端 | Node.js + Express + TypeScript（分层：routes / controllers / services / repositories / models / middlewares / constructors） |
| 数据库 | MySQL 8.0（`database/init.sql` 全量表结构 + `backend/prisma/schema.prisma`；默认使用本地种子内存库） |
| 认证鉴权 | JWT + RBAC（四角色动作权限表） |
| 部署 | Docker Compose（frontend / backend / db，命名卷 + healthcheck 依赖链） |

## 项目目录结构

```text
.
├── docker-compose.yml         # 顶层 name: grid-repair；容器名带 ${COMPOSE_PROJECT_NAME} 前缀
├── .env.example               # 全部环境变量及默认值
├── database/init.sql          # MySQL 8 全量 DDL（八张表 + 枚举 + 索引 + 演示账户）
├── frontend/
│   ├── Dockerfile             # 多阶段构建，Nginx 托管
│   ├── nginx.conf             # /api/ 反代 + try_files SPA 回退
│   └── src/
│       ├── api/               # 按实体分文件（本地 localDb 数据访问）
│       ├── stores/            # 按实体分 Pinia store + Session/Domain/AuditLog
│       ├── services/          # 业务规则层（合并/派工/状态机/库存/复电联动/RBAC 守卫）
│       ├── types/             # 共享类型（含三组枚举的类型镜像、角色、审计日志）
│       ├── constants/         # 枚举、错误码、错误消息、日志模板、状态文案
│       ├── constructors/      # 默认对象 / 表单 / DTO 构造器
│       ├── components/common/ # StatusBadge/PriorityTag/AssetTree/CrewCard/TimelineList/StatCard/EmptyState/AuditDrawer
│       ├── hooks/             # useTicketFlow / useCrewAvailability / usePagination
│       ├── pages/             # Dashboard/Assets/Faults/Tickets/Parts 五页
│       ├── router/            # 路由表 + 角色元信息 + hash 导航
│       ├── utils/             # formatters（日期/状态/风险/用时/脱敏）/ statusMeta
│       └── mocks/             # seedData.ts 本地种子 + localDb.ts 内存单例
└── backend/
    ├── Dockerfile             # 多阶段构建，node 运行 dist
    ├── prisma/schema.prisma   # Prisma/MySQL 数据模型
    └── src/
        ├── routes/ controllers/ services/ repositories/ models/
        ├── middlewares/       # auth / rbac / auditLog / requestLogger / rateLimit / errorHandler
        ├── constants/         # 枚举 + 错误码/消息 + 日志模板（每实体 ≥4 条）
        ├── constructors/      # 请求/响应 DTO 工厂
        ├── types/ utils/ config/ seed.ts
        └── scripts/flow-check.ts
```

## 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `grid-repair` | Compose 项目名与容器名前缀 |
| `FRONTEND_PORT` | `20104` | 前端宿主机端口 |
| `BACKEND_PORT` | `21104` | 后端宿主机端口（容器内固定 3000） |
| `DB_PORT` | `33060` | MySQL 宿主机端口 |
| `DB_NAME/DB_USER/DB_PASSWORD` | `grid_repair/grid_user/grid_password` | 数据库凭据 |
| `STORAGE` | `memory` | `memory`=本地种子内存库；`mysql`=MySQL/Prisma |
| `JWT_SECRET` | `local-dev-secret` | JWT 签名密钥，生产请覆盖 |
| `RATE_LIMIT_MAX` | `120` | 每 IP 每分钟请求上限 |

## Docker 部署说明

- 根 Compose 不写 `version`，顶层 `name: grid-repair`；三个容器名均为 `${COMPOSE_PROJECT_NAME:-grid-repair}-{db,backend,frontend}`。
- 数据库使用**命名卷 `db_data`**，不绑定挂载宿主机目录，任意目录名（含中文目录）均可启动。
- `db` 配置 healthcheck；`backend` 通过 `depends_on: condition: service_healthy` 等待数据库，自身提供 `/health`；`frontend` 再等待后端健康。
- 常见问题：
  - 端口占用：修改 `.env` 中 `FRONTEND_PORT/BACKEND_PORT/DB_PORT` 后 `docker compose up -d`。
  - 重置数据库卷：`docker compose down -v`（命名卷随之删除）。
  - 仅重置业务演示数据：前端页面右上角「重置数据」。
  - 查看后端日志：`docker compose logs -f backend`。

## 枚举/常量出现位置清单

新增枚举值时至少触达：常量、类型、日志模板、错误消息、格式化、列表筛选器、详情展示组件、种子数据、README。

### FaultType（OUTAGE / VOLTAGE_LOW / TRIP / EQUIPMENT_DAMAGE / SAFETY_RISK）

- 常量：`frontend/src/constants/FaultType.ts`（文案/默认分级/健康冲击/所需技能）、`backend/src/constants/FaultType.ts`
- 类型：`frontend/src/types/FaultType.ts`、`frontend/src/types/GridAsset.ts`、`frontend/src/types/FaultReport.ts`、`backend/src/types/index.ts`
- 构造器：`frontend/src/constructors/FaultReportConstructor.ts`
- 日志/错误：`frontend/src/constants/logTemplates.ts`、`backend/src/constants/logTemplates.ts`；分级校验经 `errorMessages.ts`
- 服务逻辑：`frontend/src/services/faultReportService.ts`（登记自动分级）、`repairTicketService.ts`（健康冲击/技能匹配）、后端同名 service
- 筛选器：故障报修页故障列、登记弹窗单选
- 展示组件/页面：`StatusBadge`（经 `utils/statusMeta.ts`）、`FaultsPage.vue`、`TicketsPage.vue`、资产历史故障抽屉
- 种子：`frontend/src/mocks/seedData.ts`、`backend/src/seed.ts`

### TicketStatus（WAIT_DISPATCH / ASSIGNED / ARRIVED / REPAIRING / RESTORED / CLOSED）

- 常量：`frontend/src/constants/TicketStatus.ts`（含 `TicketStatusFlow` 状态机）、后端同名常量
- 类型：`frontend/src/types/TicketStatus.ts`、`RepairTicket.ts`、后端 `types/index.ts`
- 构造器：`RepairTicketConstructor.ts`（Create/Dispatch/Restore 表单）、后端 `constructors/RepairTicketDtoFactory.ts`
- 日志：`logTemplates.ts` 的 `RepairTicket.create/dispatch/advance/restore/close`
- 错误：`TICKET_STATUS_ILLEGAL`（errorCodes + errorMessages）
- 格式化：`utils/formatters.ts` 的 `formatDuration`、`utils/statusMeta.ts` 的 ticket 配色
- 筛选器：工单页状态单选组、态势页在途工单
- 展示：`StatusBadge`、`TimelineList`（经 `hooks/useTicketFlow.ts` 生成时间线节点）、`TicketsPage.vue`
- 状态机：`services/repairTicketService.ts` 的 `AdvanceMap`（前后端各一份）

### AssetHealthStatus（NORMAL / WATCH / DEGRADED / DANGEROUS）

- 常量：`frontend/src/constants/AssetHealthStatus.ts`（文案+风险色）、后端同名常量
- 类型：`types/AssetHealthStatus.ts`、`types/GridAsset.ts`
- 构造器：`GridAssetConstructor.ts`、后端 `GridAssetDtoFactory.ts`
- 日志：`logTemplates.ts` 的 `GridAsset.healthChange`
- 联动：登记报修取严升级、复电恢复 NORMAL（`gridAssetService.applyHealthStatus` + `repairTicketService`）
- 格式化/配色：`utils/statusMeta.ts`、`StatusBadge`、`AssetTree.vue`
- 筛选器：资产页健康状态下拉、资产树
- 展示：`AssetsPage.vue`、态势页健康告警、工单详情关联资产标签
- 种子：种子数据内各资产初始档位

## 为什么该项目会「牵一发而动全身」

- 同一枚举在前端 `constants/` 与 `types/` 双份定义、后端再双份，新增状态值要同步类型、状态机、文案、配色、筛选器、时间线、日志模板、种子数据与本 README。
- 日志模板集中在 `constants/logTemplates.ts`（每实体 ≥4 条），写操作在 service 层渲染模板并写入审计库；改字段必须同步模板与所有调用处。
- 错误码与错误消息分文件集中管理，service 抛 `BusinessError`、controller/页面分别包装提示，无法只在一个全局位置吞掉异常。
- 每个实体有独立 constructor/DTO 工厂，页面与 store 不散写默认结构。
- `utils/formatters.ts` 故意混合日期、用时、状态文本、风险等级等逻辑，被五个页面和组件共同依赖。
- 复电一个动作跨 `RepairTicket / FaultReport / GridAsset / Crew / SparePartUsage / AuditLog` 六类数据联动，任何一个实体字段调整都会贯穿 api → store → service → constructor → component 多层。

## 业务规则速查

- **合并**：仅同一 `feeder_line`、目标不能是已合并单、不能自合并；主单已生成工单时，重复单直接并入该工单。
- **派工**：仅 `ON_DUTY`、`current_ticket_id` 为空、且技能标签包含 `FaultTypeRequiredSkill[fault_type]` 的班组可派。
- **备件**：申请不扣库存；仓管审批通过才扣减并写流水；审批时再次校验库存；归还按不超过领用数量回补。
- **复电**：必须填写处理结论；仅主报修单变 RESTORED，合并单保持 MERGED；资产恢复 NORMAL；班组释放值班。

## License

MIT
