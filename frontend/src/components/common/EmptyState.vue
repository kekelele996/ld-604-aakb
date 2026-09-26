<script setup lang="ts">
withDefaults(defineProps<{
  text?: string;
  hint?: string;
}>(), { text: "暂无数据", hint: "" });
</script>

<template>
  <el-empty :description="text" class="empty-state">
    <template v-if="hint"><p class="empty-hint">{{ hint }}</p></template>
    <slot />
  </el-empty>
</template>
