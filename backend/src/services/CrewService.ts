import { db } from "../repositories/inMemoryDatabase";
import { crewRepository } from "../repositories/CrewRepository";
import { BusinessError } from "../utils/BusinessError";
import { appendAuditLog, assertPermission, renderLog, type WriteContext } from "./auditService";
import type { Crew } from "../types";

export const crewService = {
  list(): Crew[] {
    return crewRepository.findAll();
  },
  getById(id: number): Crew {
    const crew = crewRepository.findById(id);
    if (!crew) throw new BusinessError("VALIDATION_FAILED");
    return crew;
  },
  toggleDuty(ctx: WriteContext, crewId: number): Crew {
    assertPermission(ctx.role, "crew:toggleDuty");
    const crew = this.getById(crewId);
    const from = crew.duty_status;
    if (crew.duty_status === "ON_DUTY") crew.duty_status = "OFF_DUTY";
    else if (crew.duty_status === "OFF_DUTY") crew.duty_status = "ON_DUTY";
    else throw new BusinessError("CREW_NOT_DISPATCHABLE", { name: crew.name });
    appendAuditLog(ctx, {
      action: "crew.dutyChange",
      target_type: "Crew",
      target_id: crew.name,
      detail: renderLog("Crew", "dutyChange", { name: crew.name, from, to: crew.duty_status })
    });
    return crew;
  },
  blockReason(crew: Crew, requiredSkill: string): string | null {
    if (crew.duty_status !== "ON_DUTY" || crew.current_ticket_id !== null) {
      return new BusinessError("CREW_NOT_DISPATCHABLE", { name: crew.name }).message;
    }
    if (!crew.skill_tags.includes(requiredSkill)) {
      return new BusinessError("CREW_SKILL_MISMATCH", { name: crew.name, skill: requiredSkill }).message;
    }
    return null;
  },
  markAssigned(ctx: WriteContext, crew: Crew, ticketNo: string, ticketId: number): void {
    crew.duty_status = "ON_SITE";
    crew.current_ticket_id = ticketId;
    appendAuditLog(ctx, {
      action: "crew.assignTicket",
      target_type: "Crew",
      target_id: crew.name,
      detail: renderLog("Crew", "assignTicket", { name: crew.name, ticket_no: ticketNo })
    });
  },
  release(ctx: WriteContext, crew: Crew): void {
    if (crew.current_ticket_id !== null) {
      crew.duty_status = "ON_DUTY";
      crew.current_ticket_id = null;
      appendAuditLog(ctx, {
        action: "crew.dutyChange",
        target_type: "Crew",
        target_id: crew.name,
        detail: renderLog("RepairTicket", "crewStatusSync", { team_name: crew.name })
      });
    }
  }
};
