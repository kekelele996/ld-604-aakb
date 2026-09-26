<script setup lang="ts">
import { computed } from "vue";
import type { GridAsset } from "../../types/GridAsset";
import StatusBadge from "./StatusBadge.vue";
import EmptyState from "./EmptyState.vue";
import { formatDate } from "../../utils/formatters";

const props = withDefaults(defineProps<{ assets: GridAsset[]; activeLine?: string; activeAssetId?: number | null }>(), {
  activeLine: "",
  activeAssetId: null
});
const emit = defineEmits<{ (e: "select", asset: GridAsset): void }>();

interface LineGroup {
  line: string;
  children: GridAsset[];
}

const groups = computed<LineGroup[]>(() => {
  const map = new Map<string, GridAsset[]>();
  props.assets.forEach((asset) => {
    const list = map.get(asset.feeder_line) ?? [];
    list.push(asset);
    map.set(asset.feeder_line, list);
  });
  return [...map.entries()]
    .map(([line, children]) => ({ line, children: children.sort((a, b) => a.asset_code.localeCompare(b.asset_code)) }))
    .sort((a, b) => a.line.localeCompare(b.line));
});

const openedLines = computed(() => groups.value.map((group) => group.line));
</script>

<template>
  <div class="asset-tree">
    <EmptyState v-if="!groups.length" text="该线路下暂无资产" />
    <el-collapse v-else :model-value="openedLines">
      <el-collapse-item v-for="group in groups" :key="group.line" :name="group.line">
        <template #title>
          <span class="line-node" :class="{ active: group.line === activeLine }">
            <el-icon><Connection /></el-icon>
            {{ group.line }}
            <el-tag size="small" type="info" effect="plain" round>{{ group.children.length }}</el-tag>
          </span>
        </template>
        <button
          v-for="asset in group.children"
          :key="asset.id"
          type="button"
          class="asset-node"
          :class="{ selected: asset.id === activeAssetId }"
          @click="emit('select', asset)"
        >
          <span class="asset-code">{{ asset.asset_code }}</span>
          <span class="asset-meta">{{ asset.voltage_level }} · {{ formatDate(asset.last_fault_at) }} 最近故障</span>
          <StatusBadge kind="health" :value="asset.health_status" plain />
        </button>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.line-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #274335;
}
.line-node.active { color: #b4691d; }
.asset-node {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "code badge" "meta badge";
  gap: 2px 10px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid #e4e0d3;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #fff;
  cursor: pointer;
}
.asset-node:hover, .asset-node.selected { border-color: #d39b46; background: #fdf6ea; }
.asset-code { grid-area: code; font-weight: 700; font-size: 13px; }
.asset-meta { grid-area: meta; color: #8a8f86; font-size: 12px; }
.asset-node > :deep(.el-tag) { grid-area: badge; align-self: center; }
</style>
