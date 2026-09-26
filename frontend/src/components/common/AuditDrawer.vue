<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuditLogStore } from "../../stores/AuditLogStore";
import { useSessionStore } from "../../stores/SessionStore";
import { usePagination } from "../../hooks/usePagination";
import { RoleText } from "../../types/Role";
import { formatDateTimeFull } from "../../utils/formatters";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const auditStore = useAuditLogStore();
const session = useSessionStore();
const { rows } = storeToRefs(auditStore);

const actionFilter = ref("");
const entityFilter = ref("");

const filtered = computed(() =>
  rows.value.filter(
    (log) =>
      (!actionFilter.value || log.action.includes(actionFilter.value)) &&
      (!entityFilter.value || log.target_type === entityFilter.value)
  )
);
const { pageRows, page, totalPages, go } = usePagination(filtered, 10);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

watch(visible, async (open) => {
  if (open) await auditStore.load();
});

const entityOptions = ["FaultReport", "RepairTicket", "Crew", "SparePartUsage", "SparePart", "GridAsset"];
</script>

<template>
  <el-drawer v-model="visible" title="操作审计日志" size="560px" destroy-on-close>
    <el-alert
      v-if="session.role === 'AUDITOR'"
      type="success"
      :closable="false"
      show-icon
      title="审计员视角：全部写操作留痕，仅可查看不可修改"
      style="margin-bottom: 12px"
    />
    <el-alert
      v-else
      type="info"
      :closable="false"
      title="所有登记、合并、派工、流转、审批、库存变动均在此留痕"
      style="margin-bottom: 12px"
    />

    <div class="filter-bar">
      <el-select v-model="entityFilter" placeholder="全部对象" clearable style="width: 170px">
        <el-option v-for="entity in entityOptions" :key="entity" :label="entity" :value="entity" />
      </el-select>
      <el-select v-model="actionFilter" placeholder="全部动作" clearable style="width: 180px">
        <el-option label="登记/创建" value="register" />
        <el-option label="创建" value="create" />
        <el-option label="合并" value="merge" />
        <el-option label="派工" value="dispatch" />
        <el-option label="状态流转" value="advance" />
        <el-option label="复电" value="restore" />
        <el-option label="备件审批" value="part.approve" />
        <el-option label="备件驳回" value="reject" />
        <el-option label="库存调整" value="stock" />
      </el-select>
    </div>

    <div v-for="log in pageRows" :key="log.id" class="log-drawer-item">
      <div class="log-time">{{ formatDateTimeFull(log.created_at) }} · {{ log.target_type }}#{{ log.target_id }}</div>
      <div class="log-detail">{{ log.detail }}</div>
      <div class="log-actor">{{ log.actor }}（{{ RoleText[log.actor_role] }}）· {{ log.action }}</div>
    </div>

    <div class="pager">
      <el-pagination
        layout="prev, pager, next"
        :current-page="page"
        :page-size="10"
        :total="filtered.length"
        @current-change="go"
      />
    </div>
  </el-drawer>
</template>
