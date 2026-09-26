import { defineStore } from "pinia";
import { Role } from "../constants/Role";
import { can, type Action } from "../constants/permissions";
import type { CurrentUser } from "../types/Audit";
import { saveCurrentUser, readCurrentUser } from "../api/http";

/** 四个内置演示账号，对应 RBAC 四种角色（无登录页，顶栏直接切换） */
export const ROLE_USERS: Record<Role, CurrentUser> = {
  [Role.DISPATCHER]: { id: 1, name: "调度员 郑凯", role: Role.DISPATCHER },
  [Role.LEADER]: { id: 101, name: "周建国", role: Role.LEADER },
  [Role.WAREHOUSE]: { id: 201, name: "仓管员 钱敏", role: Role.WAREHOUSE },
  [Role.AUDITOR]: { id: 301, name: "审计员 孙洁", role: Role.AUDITOR }
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: (readCurrentUser() ?? ROLE_USERS[Role.DISPATCHER]) as CurrentUser
  }),
  getters: {
    role: (s) => s.user.role,
    isDispatcher: (s) => s.user.role === Role.DISPATCHER,
    isLeader: (s) => s.user.role === Role.LEADER,
    isWarehouse: (s) => s.user.role === Role.WAREHOUSE,
    isAuditor: (s) => s.user.role === Role.AUDITOR
  },
  actions: {
    switchRole(role: Role) {
      this.user = ROLE_USERS[role];
      saveCurrentUser(this.user);
    },
    /** 按钮级权限：组件 v-if="auth.can(Action.XXX)" */
    can(action: Action): boolean {
      return can(this.user.role, action);
    }
  }
});
