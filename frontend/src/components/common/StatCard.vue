<script setup lang="ts">
withDefaults(defineProps<{ label: string; value: string | number; hint?: string; tone?: "default" | "danger" | "warning" | "success" }>(), {
  hint: "",
  tone: "default"
});
</script>

<template>
  <div class="stat" :class="`tone-${tone}`">
    <span class="stat-label">{{ label }}</span>
    <strong class="stat-value">{{ value }}</strong>
    <small v-if="hint" class="stat-hint">{{ hint }}</small>
  </div>
</template>

<style scoped>
.stat {
  background: #fbfaf4;
  border: 1px solid #d8d6c8;
  border-left: 4px solid #274335;
  border-radius: 8px;
  padding: 16px 18px;
  display: grid;
  gap: 4px;
}
.tone-danger { border-left-color: #c0392b; }
.tone-warning { border-left-color: #d2691e; }
.tone-success { border-left-color: #24874f; }
.stat-label { color: #596257; font-size: 13px; }
.stat-value { font-size: 30px; color: #274335; line-height: 1.1; }
.stat-hint { color: #8a8f86; }
</style>
