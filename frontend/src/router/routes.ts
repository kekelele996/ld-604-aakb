import type { Role } from "../types/Role";

export interface AppRoute {
  name: string;
  route: string;
  icon: string;
  /** 可访问该页面的角色；审计员默认可读全部页面（只读） */
  roles: Role[];
  hint: string;
}

/**
 * 前端路由守卫依据 roles 控制导航；
 * 页面内写操作按钮另以 can(role, action) 控制显隐，service 层再次强校验。
 */
export const routes: AppRoute[] = [
  {
    name: "抢修态势",
    route: "/dashboard",
    icon: "Monitor",
    roles: ["DISPATCHER", "LEADER", "WAREHOUSE", "AUDITOR"],
    hint: "待派工、抢修进度、班组状态与平均复电时间"
  },
  {
    name: "配网资产",
    route: "/assets",
    icon: "Connection",
    roles: ["DISPATCHER", "LEADER", "WAREHOUSE", "AUDITOR"],
    hint: "线路台账、健康状况与历史故障"
  },
  {
    name: "故障报修",
    route: "/faults",
    icon: "BellFilled",
    roles: ["DISPATCHER", "LEADER", "WAREHOUSE", "AUDITOR"],
    hint: "登记、分级、同线路重复合并与生成工单"
  },
  {
    name: "抢修工单",
    route: "/tickets",
    icon: "Tools",
    roles: ["DISPATCHER", "LEADER", "WAREHOUSE", "AUDITOR"],
    hint: "派工、到场、处理、备件申请与复电确认"
  },
  {
    name: "备件领用",
    route: "/parts",
    icon: "Box",
    roles: ["DISPATCHER", "LEADER", "WAREHOUSE", "AUDITOR"],
    hint: "备件申请、审批出库、归还回补与库存流水"
  }
];
