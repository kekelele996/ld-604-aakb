<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: "暂无数据" });
</script>

<template>
  <el-empty :description="text" :image-size="80" />
</template>
