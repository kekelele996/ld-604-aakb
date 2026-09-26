import type { RouteRecordRaw } from "vue-router";
import { Role } from "../constants/Role";

/**
 * 路由元信息 meta.actions：页面进入所需权限；
 * 审计员拥有 audit:view，可进入全部只读页面；其余页面四种角色均可进入，
 * 真正的操作级隔离在组件按钮显隐 + 后端 rbacMiddleware 双层控制。
 */
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard"
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("../pages/DashboardPage.vue"),
    meta: { name: "抢修态势", icon: "Odometer" }
  },
  {
    path: "/assets",
    name: "assets",
    component: () => import("../pages/AssetsPage.vue"),
    meta: { name: "配网资产", icon: "Grid" }
  },
  {
    path: "/faults",
    name: "faults",
    component: () => import("../pages/FaultsPage.vue"),
    meta: { name: "故障报修", icon: "Warning" }
  },
  {
    path: "/tickets",
    name: "tickets",
    component: () => import("../pages/TicketsPage.vue"),
    meta: { name: "抢修工单", icon: "Tickets" }
  },
  {
    path: "/parts",
    name: "parts",
    component: () => import("../pages/PartsPage.vue"),
    meta: { name: "备件领用", icon: "Box" }
  },
  {
    path: "/audit",
    name: "audit",
    component: () => import("../pages/AuditPage.vue"),
    meta: { name: "操作审计", icon: "Document", roles: [Role.DISPATCHER, Role.LEADER, Role.WAREHOUSE, Role.AUDITOR] }
  }
];
