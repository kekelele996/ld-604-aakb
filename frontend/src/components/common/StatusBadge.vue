<script setup lang="ts">
import { computed } from "vue";
import { resolveBadge } from "../../utils/statusMeta";

const props = withDefaults(defineProps<{ kind?: string; value: string; plain?: boolean }>(), {
  kind: "raw",
  plain: false
});

const meta = computed(() => resolveBadge(props.kind, props.value));
</script>

<template>
  <el-tag
    :type="meta.color ? undefined : meta.type"
    :effect="plain ? 'plain' : 'light'"
    size="small"
    round
    :style="meta.color ? { backgroundColor: meta.color, borderColor: meta.color, color: '#fff' } : undefined"
  >
    {{ meta.text }}
  </el-tag>
</template>
