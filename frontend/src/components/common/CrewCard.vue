<script setup lang="ts">
import { computed } from "vue";
import type { Crew } from "../../types/Crew";
import StatusBadge from "./StatusBadge.vue";
import { formatSkills } from "../../utils/formatters";
import { SkillTagText } from "../../constants/CrewDutyStatus";

const props = withDefaults(
  defineProps<{
    crew: Crew;
    /** 当前派工所需技能：缺失的技能高亮提示 */
    requiredSkill?: string;
    selectable?: boolean;
    selected?: boolean;
  }>(),
  { requiredSkill: "", selectable: false, selected: false }
);
const emit = defineEmits<{ (e: "select", crew: Crew): void }>();

const skillMissing = computed(() => !!props.requiredSkill && !props.crew.skill_tags.includes(props.requiredSkill));
const busy = computed(() => props.crew.duty_status !== "ON_DUTY" || props.crew.current_ticket_id !== null);
const clickable = computed(() => props.selectable && !busy.value && !skillMissing.value);
</script>

<template>
  <div
    class="crew-card"
    :class="{ clickable, selected, disabled: busy || skillMissing }"
    :title="skillMissing ? `缺少技能：${SkillTagText[requiredSkill] ?? requiredSkill}` : busy ? '班组当前不可派工' : ''"
    @click="clickable && emit('select', crew)"
  >
    <div class="crew-head">
      <strong>{{ crew.name }}</strong>
      <StatusBadge kind="duty" :value="crew.duty_status" />
    </div>
    <div class="crew-line">负责人：{{ crew.leader_name }} · {{ crew.contact_phone }}</div>
    <div class="crew-skills">
      <el-tag
        v-for="tag in crew.skill_tags"
        :key="tag"
        size="small"
        :type="tag === requiredSkill ? 'success' : 'info'"
        effect="plain"
      >
        {{ SkillTagText[tag] ?? tag }}
      </el-tag>
      <el-tag v-if="skillMissing" size="small" type="danger" effect="dark">
        缺 {{ SkillTagText[requiredSkill] ?? requiredSkill }}
      </el-tag>
    </div>
    <div class="crew-foot">
      <span>{{ formatSkills(crew.skill_tags) }}</span>
      <el-icon v-if="selected" color="#24874f"><Select /></el-icon>
    </div>
  </div>
</template>

<style scoped>
.crew-card {
  border: 1px solid #d8d6c8;
  border-radius: 8px;
  padding: 12px 14px;
  background: #fbfaf4;
  display: grid;
  gap: 6px;
}
.crew-card.clickable { cursor: pointer; }
.crew-card.clickable:hover { border-color: #d39b46; background: #fdf6ea; }
.crew-card.selected { border-color: #24874f; box-shadow: 0 0 0 2px rgba(36, 135, 79, 0.15); }
.crew-card.disabled { opacity: 0.62; }
.crew-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.crew-line { font-size: 12px; color: #596257; }
.crew-skills { display: flex; flex-wrap: wrap; gap: 4px; }
.crew-foot { display: flex; justify-content: space-between; font-size: 11px; color: #a3a79e; }
</style>
