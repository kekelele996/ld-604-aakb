<script setup lang="ts">
import type { SparePartUsage } from "../../types/SparePartUsage";
import { PartStatus } from "../../constants/PartStatus";
import { formatTime } from "../../utils/formatters";
import StatusBadge from "./StatusBadge.vue";
import EmptyState from "./EmptyState.vue";

/**
 * 备件审批面板：备件页仓管视图与工单详情备件区共用。
 * 只有 PENDING 申请显示批准/驳回；批准由父组件执行（审批后才扣库存）。
 */
defineProps<{
  rows: SparePartUsage[];
  /** 当前角色能否看到审批按钮 */
  canApprove?: boolean;
}>();

const emit = defineEmits<{
  (e: "approve", id: number): void;
  (e: "reject", id: number): void;
}>();

const isPending = (status: string) => status === PartStatus.PENDING;
</script>

<template>
  <div class="approval-panel">
    <EmptyState v-if="rows.length === 0" text="暂无备件申请" hint="班组长在工单详情中提交申请后会出现在这里" />
    <div v-for="row in rows" :key="row.id" class="approval-item">
      <div class="approval-main">
        <div class="approval-title">
          <span class="approval-part">{{ row.part_name }}</span>
          <span class="approval-code">{{ row.part_code }}</span>
          <StatusBadge :value="row.usage_status" group="PartStatus" size="small" />
        </div>
        <div class="approval-meta">
          申请 #{{ row.id }} · 工单 #{{ row.ticket_id }} · 数量 {{ row.quantity }} ·
          {{ row.warehouse_name }} · 申请人 {{ row.requested_by }} · {{ formatTime(row.created_at) }}
        </div>
        <div v-if="row.approved_by" class="approval-meta">审批人：{{ row.approved_by }}（{{ formatTime(row.approved_at) }}）</div>
        <div v-if="row.reject_reason" class="approval-reject">驳回原因：{{ row.reject_reason }}</div>
      </div>
      <div v-if="canApprove && isPending(row.usage_status)" class="approval-actions">
        <el-button type="success" size="small" @click="emit('approve', row.id)">批准并出库</el-button>
        <el-button type="danger" plain size="small" @click="emit('reject', row.id)">驳回</el-button>
      </div>
    </div>
  </div>
</template>
