<script setup lang="ts">
import { computed } from "vue";
import type { Crew } from "../../types/Crew";
import { CrewDutyStatusText } from "../../constants/CrewDutyStatus";
import StatusBadge from "./StatusBadge.vue";
import { Action } from "../../constants/permissions";

/**
 * 班组卡片：态势页班组状态 + 工单页派工面板共用。
 * selectable 时显示选择态；dispatchHint 为 useCrewAvailability 算出的不可派原因。
 */
const props = withDefaults(defineProps<{
  crew: Crew;
  selectable?: boolean;
  selected?: boolean;
  dispatchHint?: string;
  canToggleDuty?: boolean;
}>(), { selectable: false, selected: false });

const emit = defineEmits<{
  (e: "select", crew: Crew): void;
  (e: "toggle-duty", crew: Crew): void;
}>();

const skills = computed(() => props.crew.skill_tags.split(",").map((s) => s.trim()));
const clickable = computed(() => props.selectable && props.dispatchHint === undefined);
</script>

<template>
  <div
    class="crew-card"
    :class="{ selectable: clickable, selected, disabled: selectable && dispatchHint }"
    @click="clickable && emit('select', crew)"
  >
    <div class="crew-head">
      <el-icon :size="18"><UserFilled /></el-icon>
      <strong>{{ crew.name }}</strong>
      <StatusBadge :value="crew.duty_status" group="CrewDutyStatus" size="small" />
    </div>
    <div class="crew-leader">负责人：{{ crew.leader_name }} · {{ crew.contact_phone }}</div>
    <div class="crew-skills">
      <el-tag v-for="skill in skills" :key="skill" size="small" effect="plain" class="skill-tag">{{ skill }}</el-tag>
    </div>
    <div class="crew-foot">
      <span class="crew-duty-text">{{ CrewDutyStatusText[crew.duty_status] }}</span>
      <span v-if="crew.current_ticket_id" class="crew-busy">在制工单 #{{ crew.current_ticket_id }}</span>
      <el-button
        v-if="canToggleDuty"
        link
        type="primary"
        size="small"
        @click.stop="emit('toggle-duty', crew)"
      >{{ crew.duty_status === "ON_DUTY" ? "置为休班" : "召回值班" }}</el-button>
    </div>
    <div v-if="dispatchHint" class="crew-hint"><el-icon><WarningFilled /></el-icon>{{ dispatchHint }}</div>
  </div>
</template>
