import type { Role } from "./Role";

export interface AuditLog {
  id: number;
  actor: string;
  actor_role: Role;
  /** 动作码，如 ticket.dispatch / part.approve */
  action: string;
  target_type: "FaultReport" | "RepairTicket" | "Crew" | "SparePartUsage" | "SparePart" | "GridAsset" | "System";
  target_id: string;
  detail: string;
  created_at: string;
}
