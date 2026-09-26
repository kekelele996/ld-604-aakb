<script setup lang="ts">
import EmptyState from "./EmptyState.vue";
import { formatDateTimeFull } from "../../utils/formatters";

export interface TimelineNode {
  label: string;
  time: string | null;
  reached: boolean;
  active: boolean;
  meta?: string;
}

defineProps<{ nodes: TimelineNode[]; emptyText?: string }>();
</script>

<template>
  <div class="timeline">
    <EmptyState v-if="!nodes.length" :text="emptyText ?? '暂无流转记录'" />
    <el-timeline v-else>
      <el-timeline-item
        v-for="node in nodes"
        :key="node.label"
        :type="node.active ? 'primary' : node.reached ? 'success' : 'info'"
        :hollow="!node.reached"
        :timestamp="node.time ? formatDateTimeFull(node.time) : '未到达'"
        placement="top"
      >
        <span :class="{ muted: !node.reached, active: node.active }">{{ node.label }}</span>
        <small v-if="node.meta" class="node-meta">{{ node.meta }}</small>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped>
.muted { color: #a3a79e; }
.active { font-weight: 800; color: #b4691d; }
.node-meta { display: block; color: #596257; margin-top: 2px; }
</style>
