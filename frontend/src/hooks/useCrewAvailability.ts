import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { dispatchBlockReason } from "../services/crewService";
import { SkillTagText } from "../constants/CrewDutyStatus";
import type { Crew } from "../types/Crew";

/**
 * 班组可用性 hook：按技能、值班状态、在做工单给出派工可行性。
 * 调度员派工弹窗、态势页班组状态、工单详情 CrewCard 共用。
 */
export function useCrewAvailability(crewsSource: MaybeRefOrGetter<Crew[]>, requiredSkillSource: MaybeRefOrGetter<string>) {
  const evaluations = computed(() => {
    const requiredSkill = toValue(requiredSkillSource);
    return toValue(crewsSource).map((crew) => {
      const reason = dispatchBlockReason(crew, requiredSkill);
      return {
        crew,
        dispatchable: reason === null,
        reason,
        skillLabel: SkillTagText[requiredSkill] ?? requiredSkill
      };
    });
  });

  const dispatchableCrews = computed(() => evaluations.value.filter((item) => item.dispatchable).map((item) => item.crew));

  return { evaluations, dispatchableCrews };
}
