<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "warning" | "danger" | "success";
  icon?: string;
}>(), { tone: "default" });
</script>

<template>
  <div class="stat-card" :class="`tone-${tone}`">
    <div class="stat-icon"><el-icon :size="22"><component :is="icon" /></el-icon></div>
    <div class="stat-body">
      <span class="stat-label">{{ label }}</span>
      <strong class="stat-value">{{ value }}</strong>
      <small v-if="sub" class="stat-sub">{{ sub }}</small>
    </div>
  </div>
</template>
