<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore } from "../stores/authStore";
import { RoleText, type Role } from "../constants/Role";
import { formatDate } from "../utils/formatters";
import StatCard from "../components/common/StatCard.vue";
import EmptyState from "../components/common/EmptyState.vue";

const data = useDataStore();
const auth = useAuthStore();
onMounted(() => data.load());

const actorFilter = ref("");
const targetFilter = ref("");
const keyword = ref("");

const filteredLogs = computed(() =>
  data.auditLogs.filter((log) => {
    if (actorFilter.value && log.actor_role !== actorFilter.value) return false;
    if (targetFilter.value && log.target_type !== targetFilter.value) return false;
    if (keyword.value && !log.action.includes(keyword.value)) return false;
    return true;
  })
);

const roleOptions = Object.entries(RoleText).map(([value, label]) => ({ value: value as Role, label }));
const writeCount = computed(() => data.auditLogs.filter((l) => l.target_type !== "Auth").length);
</script>

<template>
  <div class="grid" style="gap:16px">
    <div class="grid grid-4">
      <StatCard label="写操作记录" :value="writeCount" sub="所有登记/派工/流转/审批均留痕" tone="success" icon="Document" />
      <StatCard label="库存流水" :value="data.stockTxns.length" sub="出库/归还/盘点" tone="warning" icon="Swap" />
      <StatCard label="涉及角色" value="4" sub="调度/班组/仓管/审计" icon="User" />
      <StatCard label="当前视角" :value="RoleText[auth.role]" sub="审计员只读" icon="View" />
    </div>

    <div class="panel">
      <div class="panel-head">
        <div>
          <h2>操作审计日志</h2>
          <div class="desc">按操作人角色、实体类型和关键字检索；日志仅追加不可修改</div>
        </div>
      </div>
      <div class="toolbar">
        <el-select v-model="actorFilter" placeholder="操作角色" clearable style="width:170px">
          <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="targetFilter" placeholder="实体类型" clearable style="width:150px">
          <el-option label="故障报修" value="FaultReport" />
          <el-option label="抢修工单" value="RepairTicket" />
          <el-option label="配网资产" value="GridAsset" />
          <el-option label="抢修班组" value="Crew" />
          <el-option label="备件" value="SparePart" />
        </el-select>
        <el-input v-model="keyword" placeholder="搜索日志内容" clearable style="width:220px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <el-table :data="filteredLogs" stripe>
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="150">
          <template #default="{ row }">
            {{ row.actor }}
            <el-tag size="small" effect="plain" style="margin-left:4px">{{ RoleText[row.actor_role as Role] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实体" prop="target_type" width="120" />
        <el-table-column label="对象" prop="target_id" width="80" />
        <el-table-column label="操作内容" prop="action" min-width="320" />
      </el-table>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>备件库存流水（与审批/归还联动）</h2></div>
      <EmptyState v-if="data.stockTxns.length === 0" text="暂无库存流水" />
      <el-table v-else :data="data.stockTxns" stripe>
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="part_code" label="编码" width="150" class-name="mono" />
        <el-table-column prop="part_name" label="备件" min-width="180" />
        <el-table-column label="变动" width="90">
          <template #default="{ row }">
            <strong :style="{ color: row.change < 0 ? 'var(--danger)' : 'var(--brand)' }">
              {{ row.change > 0 ? "+" : "" }}{{ row.change }}
            </strong>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="结余" width="80" />
        <el-table-column prop="operator" label="经手人" width="120" />
        <el-table-column prop="remark" label="说明" min-width="180" />
      </el-table>
    </div>
  </div>
</template>
