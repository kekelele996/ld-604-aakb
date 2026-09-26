/**
 * 角色枚举（RBAC）
 * 触达：types/Auth.ts、stores/authStore.ts、router/guards.ts、
 * constants/permissions.ts、App.vue 角色切换、各页面按钮显隐、后端中间件
 */
export const Role = {
  DISPATCHER: "DISPATCHER",
  LEADER: "LEADER",
  WAREHOUSE: "WAREHOUSE",
  AUDITOR: "AUDITOR"
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const RoleText: Record<Role, string> = {
  DISPATCHER: "调度员",
  LEADER: "班组长",
  WAREHOUSE: "仓管（备件员）",
  AUDITOR: "审计员"
};

export const RoleOptions = Object.values(Role).map((value) => ({
  label: RoleText[value],
  value
}));
