<script setup lang="ts">
import { computed } from "vue";
import type { GridAsset } from "../../types/GridAsset";
import StatusBadge from "./StatusBadge.vue";

/**
 * 线路-资产树：按馈线分组，资产页与资产详情抽屉共用。
 * 选中线路时向页面 emit line，用于列表筛选；选中资产 emit asset。
 */
const props = defineProps<{
  assets: GridAsset[];
  activeLine?: string;
}>();

const emit = defineEmits<{
  (e: "select-line", line: string): void;
  (e: "select-asset", asset: GridAsset): void;
}>();

interface LineNode {
  line: string;
  total: number;
  abnormal: number;
  children: GridAsset[];
}

const tree = computed<LineNode[]>(() => {
  const map = new Map<string, GridAsset[]>();
  props.assets.forEach((a) => {
    const list = map.get(a.feeder_line) ?? [];
    list.push(a);
    map.set(a.feeder_line, list);
  });
  return [...map.entries()].map(([line, children]) => ({
    line,
    total: children.length,
    abnormal: children.filter((a) => a.health_status !== "NORMAL").length,
    children
  }));
});
</script>

<template>
  <div class="asset-tree">
    <div
      v-for="node in tree"
      :key="node.line"
      class="tree-line"
      :class="{ active: activeLine === node.line }"
    >
      <div class="tree-line-head" @click="emit('select-line', node.line)">
        <el-icon><Connection /></el-icon>
        <span class="tree-line-name">{{ node.line }}</span>
        <el-badge v-if="node.abnormal" :value="node.abnormal" class="tree-badge" type="danger" />
        <span class="tree-count">{{ node.total }} 台</span>
      </div>
      <div class="tree-children">
        <div
          v-for="asset in node.children"
          :key="asset.id"
          class="tree-asset"
          @click="emit('select-asset', asset)"
        >
          <span class="tree-code">{{ asset.asset_code }}</span>
          <span class="tree-type">{{ asset.asset_type }}</span>
          <StatusBadge :value="asset.health_status" group="AssetHealthStatus" size="small" />
        </div>
      </div>
    </div>
  </div>
</template>
