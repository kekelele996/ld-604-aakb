export const RoleList = ["DISPATCHER", "LEADER", "WAREHOUSE", "AUDITOR"] as const;
export type Role = (typeof RoleList)[number];

export const RoleText: Record<Role, string> = {
  DISPATCHER: "调度员",
  LEADER: "班组长",
  WAREHOUSE: "仓管（备件员）",
  AUDITOR: "审计员"
};

/** 各角色可执行的写操作动作码，RBAC 单一事实来源（store 守卫与按钮显隐共用） */
export const RolePermissions: Record<Role, string[]> = {
  DISPATCHER: [
    "fault:register",
    "fault:merge",
    "ticket:create",
    "ticket:dispatch",
    "crew:toggleDuty"
  ],
  LEADER: [
    "ticket:advance",
    "ticket:restore",
    "part:apply",
    "part:return",
    "asset:update"
  ],
  WAREHOUSE: [
    "part:approve",
    "part:reject",
    "stock:adjust"
  ],
  AUDITOR: [
    "audit:view"
  ]
};

export function can(role: Role | undefined, action: string): boolean {
  return !!role && RolePermissions[role].includes(action);
}
