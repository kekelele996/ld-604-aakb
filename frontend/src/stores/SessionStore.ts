import { defineStore } from "pinia";
import { RoleList, RoleText, type Role } from "../types/Role";
import type { WriteContext } from "../services/auditService";

export interface SessionUser {
  role: Role;
  /** 调度员固定坐席；班组长/仓管使用其常用署名，写入审计日志 */
  name: string;
}

/** 各角色默认操作人署名（本地演示，无真实登录服务） */
const RoleActorName: Record<Role, string> = {
  DISPATCHER: "调度员-林调度",
  LEADER: "张建国（班组长）",
  WAREHOUSE: "仓管员-周敏",
  AUDITOR: "审计员-郑审计"
};

/**
 * 会话 store：角色切换即前端路由守卫 + 按钮显隐 + 写操作留痕的身份来源。
 * 模拟 JWT 登录态，全部本地校验，不请求第三方。
 */
export const useSessionStore = defineStore("session", {
  state: (): { role: Role; users: Record<Role, string> } => ({
    role: "DISPATCHER",
    users: { ...RoleActorName }
  }),
  getters: {
    user(state): SessionUser {
      return { role: state.role, name: state.users[state.role] };
    },
    /** service 层写操作上下文（actor 写入审计日志，role 做 RBAC 校验） */
    ctx(state): WriteContext {
      return { actor: state.users[state.role], role: state.role };
    },
    roleName(state): string {
      return RoleText[state.role];
    },
    roles() {
      return RoleList.map((role) => ({ role, name: RoleText[role], actor: RoleActorName[role] }));
    }
  },
  actions: {
    switchRole(role: Role) {
      this.role = role;
    },
    /** 班组长视角可切换为不同班组负责人（影响署名，不影响权限） */
    setActorName(name: string) {
      this.users[this.role] = name;
    }
  }
});
