<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "../router/useRouter";
import { useFaultReportStore } from "../stores/FaultReportStore";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { useCrewStore } from "../stores/CrewStore";
import { useGridAssetStore } from "../stores/GridAssetStore";
import { useSparePartUsageStore } from "../stores/SparePartUsageStore";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import CrewCard from "../components/common/CrewCard.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { formatDuration, durationMinutes } from "../utils/formatters";
import { CrewDutyOrder } from "../constants/CrewDutyStatus";
import type { RepairTicket } from "../types/RepairTicket";

const { navigate } = useRouter();
const faultStore = useFaultReportStore();
const ticketStore = useRepairTicketStore();
const crewStore = useCrewStore();
const assetStore = useGridAssetStore();
const partStore = useSparePartUsageStore();

const activeTickets = computed(() =>
  ticketStore.rows
    .filter((ticket) => ["WAIT_DISPATCH", "ASSIGNED", "ARRIVED", "REPAIRING"].includes(ticket.status))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
);

/** 平均复电时间：已复电工单 assigned_at → restored_at */
const averageRestore = computed(() => {
  const minutes = ticketStore.rows
    .map((ticket) => durationMinutes(ticket.assigned_at, ticket.restored_at))
    .filter((value): value is number => value !== null);
  if (!minutes.length) return "—";
  const avg = Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length);
  const h = Math.floor(avg / 60);
  const m = avg % 60;
  return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
});

function primaryReport(ticket: RepairTicket) {
  return faultStore.byId(ticket.fault_report_id);
}
function ticketTeam(ticket: RepairTicket) {
  return crewStore.byId(ticket.team_id);
}
function ticketAssetLine(ticket: RepairTicket) {
  const report = primaryReport(ticket);
  return report ? assetStore.byId(report.asset_id)?.feeder_line ?? "—" : "—";
}
function mergedCount(ticket: RepairTicket) {
  return ticket.merged_report_ids.length;
}
function affectedUsers(ticket: RepairTicket) {
  return ticketStore.reportsOf(ticket).reduce((sum, report) => sum + report.affected_users, 0);
}
</script>

<template>
  <section class="metrics">
    <StatCard label="待派工工单" :value="ticketStore.waitingCount" tone="danger" hint="同线路重复报修已合并" />
    <StatCard label="抢修中工单" :value="ticketStore.activeCount" tone="warning" hint="已派工 / 已到场 / 处理中" />
    <StatCard label="值班班组" :value="`${crewStore.onDutyCount}/${crewStore.rows.length}`" tone="success" hint="可派工班组数" />
    <StatCard label="平均复电时间" :value="averageRestore" hint="派工至复电（历史均值）" />
  </section>

  <section class="grid-2">
    <div class="panel">
      <h2><el-icon><Tools /></el-icon> 在途抢修 <el-tag size="small" type="info" effect="plain">{{ activeTickets.length }}</el-tag></h2>
      <EmptyState v-if="!activeTickets.length" text="当前没有在途工单" />
      <el-table v-else :data="activeTickets" size="small" class="clickable-row" @row-click="(row: RepairTicket) => navigate('/tickets')">
        <el-table-column label="工单号" prop="ticket_no" width="150">
          <template #default="{ row }"><span class="mono">{{ row.ticket_no }}</span></template>
        </el-table-column>
        <el-table-column label="线路" min-width="170">
          <template #default="{ row }">{{ ticketAssetLine(row as RepairTicket) }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }"><PriorityTag :value="row.priority" size="small" /></template>
        </el-table-column>
        <el-table-column label="状态" width="92">
          <template #default="{ row }"><StatusBadge kind="ticket" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="班组" min-width="130">
          <template #default="{ row }">{{ ticketTeam(row as RepairTicket)?.name ?? "未派工" }}</template>
        </el-table-column>
        <el-table-column label="影响/合并" width="96">
          <template #default="{ row }">
            {{ affectedUsers(row as RepairTicket) }} 户
            <div v-if="mergedCount(row as RepairTicket)" class="danger-text">含 {{ mergedCount(row as RepairTicket) }} 单重复</div>
          </template>
        </el-table-column>
        <el-table-column label="历时" width="110">
          <template #default="{ row }">{{ formatDuration(row.assigned_at, row.restored_at ?? new Date().toISOString()) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel">
      <h2><el-icon><UserFilled /></el-icon> 班组状态</h2>
      <div style="display: grid; gap: 10px">
        <CrewCard v-for="crew in [...crewStore.rows].sort((a, b) => CrewDutyOrder[a.duty_status] - CrewDutyOrder[b.duty_status])" :key="crew.id" :crew="crew" />
      </div>
    </div>
  </section>

  <section class="grid-3">
    <div class="panel tight">
      <h3>待处理报修 / 待审批备件</h3>
      <p class="success-text" style="font-size: 24px; margin: 4px 0">
        {{ faultStore.pendingCount }} 单 / {{ partStore.pendingCount }} 份
      </p>
      <el-button link type="primary" @click="navigate('/faults')">前往故障报修 →</el-button>
      <el-button link type="primary" @click="navigate('/parts')">前往备件审批 →</el-button>
    </div>
    <div class="panel tight">
      <h3>资产健康告警</h3>
      <p style="margin: 4px 0">
        <span class="danger-text">{{ assetStore.healthCount.DANGEROUS }}</span> 危险 /
        <span class="muted"> {{ assetStore.healthCount.DEGRADED }}</span> 降级 /
        <span class="muted"> {{ assetStore.healthCount.WATCH }}</span> 关注
      </p>
      <el-button link type="primary" @click="navigate('/assets')">查看资产台账 →</el-button>
    </div>
    <div class="panel tight">
      <h3>最近复电</h3>
      <p style="margin: 4px 0; font-size: 13px">
        今日复电 <strong>{{ ticketStore.restoredToday }}</strong> 单；备件低库存
        <strong :class="{ 'danger-text': partStore.lowStockParts.length }">{{ partStore.lowStockParts.length }}</strong> 项
      </p>
      <el-button link type="primary" @click="navigate('/parts')">查看备件台账 →</el-button>
    </div>
  </section>
</template>
