import { computed, type MaybeRefOrGetter, toValue } from "vue";
import type { Crew } from "../types/Crew";
import type { GridAsset } from "../types/GridAsset";
import { CrewDutyStatus } from "../constants/CrewDutyStatus";

export interface CrewRank extends Crew {
  /** 技能是否覆盖故障所需技能 */
  skillMatched: boolean;
  /** 是否值班待命 */
  onDuty: boolean;
  /** 是否有在制工单 */
  occupied: boolean;
  /** 综合可派：技能匹配 + 值班 + 空闲 */
  dispatchable: boolean;
  /** 不可派原因（派工下拉显示） */
  reason: string;
}

/**
 * 班组可用性 hook —— 调度员派工依据：
 * 技能标签覆盖资产设备类别、duty_status 值班待命、无 current_ticket_id 在制任务。
 */
export function useCrewAvailability(
  crews: MaybeRefOrGetter<Crew[]>,
  asset: MaybeRefOrGetter<GridAsset | undefined>
) {
  const ranked = computed<CrewRank[]>(() => {
    const target = toValue(asset);
    return toValue(crews).map((crew) => {
      const skills = crew.skill_tags.split(",").map((s) => s.trim());
      const skillMatched = !target?.asset_type || skills.includes(target.asset_type);
      const onDuty = crew.duty_status === CrewDutyStatus.ON_DUTY;
      const occupied = crew.current_ticket_id !== null;
      const reasons: string[] = [];
      if (!skillMatched) reasons.push(`技能不匹配（需 ${target?.asset_type ?? "-"}）`);
      if (!onDuty) reasons.push("未在值班");
      if (occupied) reasons.push("有在制工单");
      return {
        ...crew,
        skillMatched,
        onDuty,
        occupied,
        dispatchable: skillMatched && onDuty && !occupied,
        reason: reasons.join("；")
      };
    });
  });

  const dispatchableCrews = computed(() => ranked.value.filter((c) => c.dispatchable));

  return { ranked, dispatchableCrews };
}
