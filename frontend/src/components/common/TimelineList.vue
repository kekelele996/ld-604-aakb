<script setup lang="ts">
import { formatTime } from "../../utils/formatters";

export interface TimelineItem {
  key: string;
  label: string;
  time?: string | null;
  desc?: string;
  done?: boolean;
  current?: boolean;
}

/** 时间线组件：工单流转（TicketsPage）与报修处置轨迹（FaultsPage）共用 */
defineProps<{
  items: TimelineItem[];
}>();
</script>

<template>
  <el-timeline class="timeline-list">
    <el-timeline-item
      v-for="item in items"
      :key="item.key"
      :type="item.done ? 'success' : 'info'"
      :hollow="!item.done"
      :timestamp="formatTime(item.time ?? null)"
      placement="top"
    >
      <span :class="{ 'tl-current': item.current }">
        <el-icon v-if="item.current" class="tl-loading"><Loading /></el-icon>
        {{ item.label }}
      </span>
      <div v-if="item.desc" class="tl-desc">{{ item.desc }}</div>
    </el-timeline-item>
  </el-timeline>
</template>
