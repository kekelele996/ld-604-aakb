<script setup lang="ts">
import { computed } from "vue";
import { formatStatus, riskTagType } from "../../utils/formatters";
import { PartStatusType } from "../../constants/PartStatus";
import { CrewDutyStatusType } from "../../constants/CrewDutyStatus";
import { FaultStatusType } from "../../constants/FaultStatus";
import { TicketStatus } from "../../constants/TicketStatus";
import type { STATUS_TEXT } from "../../constants/statusText";

type TagType = "success" | "info" | "warning" | "danger" | "primary" | "";

const props = withDefaults(
  defineProps<{
    value: string;
    /** STATUS_TEXT 中的枚举组名，决定中文文案来源 */
    group?: keyof typeof STATUS_TEXT | "auto";
    /** 手动指定 el-tag 类型，否则按风险梯度自动着色 */
    type?: TagType;
    size?: "large" | "default" | "small";
  }>(),
  { group: "auto", size: "default" }
);

const text = computed(() => formatStatus(props.value, props.group));

const tagType = computed<TagType>(() => {
  if (props.type) return props.type;
  if (props.value in PartStatusType) return PartStatusType[props.value as keyof typeof PartStatusType];
  if (props.value in CrewDutyStatusType) return CrewDutyStatusType[props.value as keyof typeof CrewDutyStatusType];
  if (props.value in FaultStatusType) return FaultStatusType[props.value as keyof typeof FaultStatusType];
  if ((Object.values(TicketStatus) as string[]).includes(props.value)) {
    return {
      WAIT_DISPATCH: "warning",
      ASSIGNED: "primary",
      ARRIVED: "primary",
      REPAIRING: "warning",
      RESTORED: "success",
      CLOSED: "info"
    }[props.value] as TagType;
  }
  return riskTagType(props.value);
});
</script>

<template>
  <el-tag :type="tagType" :size="size" effect="light" round>{{ text }}</el-tag>
</template>
