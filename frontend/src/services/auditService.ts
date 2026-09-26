import { localDb } from "../mocks/localDb";
import { createAuditLog } from "../constructors/AuditLogConstructor";
import { LOG_TEMPLATES, type LogTemplateEntity } from "../constants/logTemplates";
import { renderMessage } from "../constants/errorMessages";
import { BusinessError } from "../constants/BusinessError";
import { can, type Role } from "../types/Role";
import type { AuditLog } from "../types/AuditLog";

/** 渲染 constants/logTemplates 中的模板（{field} 占位） */
export function renderLog<T extends LogTemplateEntity>(
  entity: T,
  key: keyof (typeof LOG_TEMPLATES)[T],
  params: Record<string, string | number> = {}
): string {
  const template = LOG_TEMPLATES[entity][key] as unknown as string;
  return renderMessage(template, params);
}

/** RBAC 守卫：service 层强制，组件按钮显隐使用同源 can() */
export function assertPermission(role: Role, action: string): void {
  if (!can(role, action)) {
    throw new BusinessError("RBAC_DENIED");
  }
}

export interface WriteContext {
  actor: string;
  role: Role;
}

/** 所有写操作统一入口：留痕到 localDb.auditLogs（审计页与审计员只读视图消费） */
export function writeLog(
  ctx: WriteContext,
  entry: { action: string; target_type: AuditLog["target_type"]; target_id: string; detail: string }
): AuditLog {
  const log = createAuditLog({
    id: ++localDb.seq.log,
    actor: ctx.actor,
    actor_role: ctx.role,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    detail: entry.detail,
    created_at: new Date().toISOString()
  });
  localDb.auditLogs.unshift(log);
  return log;
}
