import { db } from "../repositories/inMemoryDatabase";
import { renderLogTemplate, type LogTemplateEntity } from "../constants/logTemplates";
import { hasPermission } from "../middlewares/rbacMiddleware";
import { BusinessError } from "../utils/BusinessError";
import type { AuditLog, Role } from "../types";

export interface WriteContext {
  actor: string;
  role: Role;
}

export function assertPermission(role: Role, action: string): void {
  if (!hasPermission(role, action)) throw new BusinessError("RBAC_DENIED", {}, 403);
}

export function appendAuditLog(
  ctx: WriteContext,
  entry: { action: string; target_type: AuditLog["target_type"]; target_id: string; detail: string }
): AuditLog {
  const log: AuditLog = {
    id: ++db.seq.log,
    actor: ctx.actor,
    actor_role: ctx.role,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    detail: entry.detail,
    created_at: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  return log;
}

export function renderLog(entity: LogTemplateEntity, key: string, params: Record<string, string | number> = {}): string {
  return renderLogTemplate(entity, key, params);
}

export function listAuditLogs(): AuditLog[] {
  return db.auditLogs;
}
