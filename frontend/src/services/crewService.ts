import { localDb } from "../mocks/localDb";
import { BusinessError } from "../constants/BusinessError";
import { writeLog, renderLog, assertPermission, type WriteContext } from "./auditService";
import { CrewDutyStatusText, SkillTagText } from "../constants/CrewDutyStatus";
import type { Crew } from "../types/Crew";

export function listCrews(): Crew[] {
  return localDb.crews;
}

export function getCrew(id: number): Crew {
  const crew = localDb.crews.find((row) => row.id === id);
  if (!crew) throw new BusinessError("VALIDATION_FAILED");
  return crew;
}

/** 调度员切换班组值班状态（出勤中班组因有在做工单不允许直接切） */
export function toggleDutyStatus(ctx: WriteContext, crewId: number): Crew {
  assertPermission(ctx.role, "crew:toggleDuty");
  const crew = getCrew(crewId);
  const from = CrewDutyStatusText[crew.duty_status];
  if (crew.duty_status === "ON_DUTY") crew.duty_status = "OFF_DUTY";
  else if (crew.duty_status === "OFF_DUTY") crew.duty_status = "ON_DUTY";
  else throw new BusinessError("CREW_NOT_DISPATCHABLE", { name: crew.name });
  const to = CrewDutyStatusText[crew.duty_status];

  writeLog(ctx, {
    action: "crew.dutyChange",
    target_type: "Crew",
    target_id: crew.name,
    detail: renderLog("Crew", "dutyChange", { name: crew.name, from, to })
  });
  return crew;
}

/**
 * 派工可行性：值班中 + 技能匹配 + 无在做工单。
 * 返回不可派工原因（null 表示可派工），供派工弹窗与 useCrewAvailability 共用。
 */
export interface DispatchBlock {
  code: "CREW_NOT_DISPATCHABLE" | "CREW_SKILL_MISMATCH";
  message: string;
}

export function dispatchBlock(crew: Crew, requiredSkill: string): DispatchBlock | null {
  if (crew.duty_status !== "ON_DUTY" || crew.current_ticket_id !== null) {
    return {
      code: "CREW_NOT_DISPATCHABLE",
      message: new BusinessError("CREW_NOT_DISPATCHABLE", { name: crew.name }).message
    };
  }
  if (!crew.skill_tags.includes(requiredSkill)) {
    return {
      code: "CREW_SKILL_MISMATCH",
      message: new BusinessError("CREW_SKILL_MISMATCH", {
        name: crew.name,
        skill: SkillTagText[requiredSkill] ?? requiredSkill
      }).message
    };
  }
  return null;
}

export function dispatchBlockReason(crew: Crew, requiredSkill: string): string | null {
  return dispatchBlock(crew, requiredSkill)?.message ?? null;
}

/** 派工/完工联动班组状态与在做工单 */
export function markCrewAssigned(ctx: WriteContext, crew: Crew, ticketNo: string, ticketId: number): void {
  crew.duty_status = "ON_SITE";
  crew.current_ticket_id = ticketId;
  writeLog(ctx, {
    action: "crew.assignTicket",
    target_type: "Crew",
    target_id: crew.name,
    detail: renderLog("Crew", "assignTicket", { name: crew.name, ticket_no: ticketNo })
  });
}

export function releaseCrewAfterRestore(ctx: WriteContext, crew: Crew): void {
  if (crew.current_ticket_id !== null) {
    crew.duty_status = "ON_DUTY";
    crew.current_ticket_id = null;
    writeLog(ctx, {
      action: "crew.dutyChange",
      target_type: "Crew",
      target_id: crew.name,
      detail: renderLog("RepairTicket", "crewStatusSync", { team_name: crew.name })
    });
  }
}
