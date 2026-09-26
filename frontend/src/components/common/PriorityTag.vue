<script setup lang="ts">
import { PriorityText, PriorityType, type Priority } from "../../constants/Priority";
import { SeverityText, type Severity } from "../../constants/Severity";
import { computed } from "vue";

/** 优先级/严重度标签，工单与报修两页共用（含态势页） */
const props = defineProps<{
  value: Priority | Severity | string;
  variant?: "priority" | "severity";
}>();

const isPriority = computed(() => (props.variant ?? "priority") === "priority");
const text = computed(() =>
  isPriority.value
    ? PriorityText[props.value as Priority] ?? props.value
    : SeverityText[props.value as Severity] ?? props.value
);
const type = computed(() =>
  isPriority.value ? PriorityType[props.value as Priority] ?? "info" : ({ NORMAL: "info", URGENT: "warning", CRITICAL: "danger" } as const)[props.value as Severity] ?? "info"
);
</script>

<template>
  <el-tag :type="type" effect="dark" size="small" disable-transitions>{{ text }}</el-tag>
</template>
