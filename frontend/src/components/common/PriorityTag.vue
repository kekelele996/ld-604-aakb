<script setup lang="ts">
import { computed } from "vue";
import { SeverityText } from "../../constants/FaultStatus";

const props = withDefaults(defineProps<{ value: string; size?: "small" | "default" }>(), { size: "default" });

const type = computed(() => (props.value === "CRITICAL" ? "danger" : props.value === "URGENT" ? "warning" : "info"));
const label = computed(() => SeverityText[props.value as keyof typeof SeverityText] ?? props.value);
</script>

<template>
  <el-tag :type="type" :size="size" effect="dark">
    <el-icon v-if="value === 'CRITICAL'" style="margin-right: 2px; vertical-align: -1px"><WarningFilled /></el-icon>
    {{ label }}
  </el-tag>
</template>
