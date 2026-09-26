import type { AuditLog } from "../types/AuditLog";

/** 审计日志构造器：所有写操作统一经此落库，禁止页面散写日志结构 */
export const createAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: 0,
  actor: "",
  actor_role: "DISPATCHER",
  action: "",
  target_type: "System",
  target_id: "",
  detail: "",
  created_at: "",
  ...overrides
});
