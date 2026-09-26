<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from "vue";
import * as echarts from "echarts";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore } from "../stores/authStore";
import { useCrewStore } from "../stores/CrewStore";
import { TicketStatus, TicketStatusText } from "../constants/TicketStatus";
import { AssetHealthStatus, AssetHealthStatusText } from "../constants/AssetHealthStatus";
import { formatDate, formatDuration } from "../utils/formatters";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import CrewCard from "../components/common/CrewCard.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { Action } from "../constants/permissions";

const data = useDataStore();
const auth = useAuthStore();
const crewStore = useCrewStore();
onMounted(() => data.load());

const waitDispatchCount = computed(() => data.tickets.filter((t) => t.status === TicketStatus.WAIT_DISPATCH).length);
const activeCount = computed(() => data.tickets.filter((t) => (["ASSIGNED", "ARRIVED", "REPAIRING"] as string[]).includes(t.status)).length);
const restoredToday = computed(() => data.tickets.filter((t) => (["RESTORED", "CLOSED"] as string[]).includes(t.status)).length);
const abnormalAssets = computed(() => data.gridAssets.filter((a) => a.health_status !== AssetHealthStatus.NORMAL).length);
const pendingParts = computed(() => data.parts.filter((p) => p.usage_status === "PENDING").length);

/** 平均复电时间：assigned_at → restored_at */
const avgRestoreDuration = computed(() => {
  const done = data.tickets.filter((t) => t.assigned_at && t.restored_at);
  if (!done.length) return "—";
  const mins = done.reduce((sum, t) => {
    return sum + (new Date(t.restored_at as string).getTime() - new Date(t.assigned_at as string).getTime()) / 60000;
  }, 0) / done.length;
  const m = Math.round(mins);
  return m < 60 ? `${m} 分钟` : `${Math.floor(m / 60)} 小时 ${m % 60} 分钟`;
});

const statusFlow = computed(() =>
  (["WAIT_DISPATCH", "ASSIGNED", "ARRIVED", "REPAIRING", "RESTORED", "CLOSED"] as const).map((s) => ({
    key: s,
    label: TicketStatusText[s],
    count: data.tickets.filter((t) => t.status === s).length
  }))
);

const activeTickets = computed(() =>
  [...data.tickets]
    .filter((t) => (t.status as string) !== TicketStatus.CLOSED)
    .sort((a, b) => (b.assigned_at ?? b.created_at).localeCompare(a.assigned_at ?? a.created_at))
);

const ticketAsset = (assetId: number) => data.gridAssets.find((a) => a.id === assetId);
const ticketCrew = (teamId: number | null) => data.crews.find((c) => c.id === teamId);
const masterFault = (id: number) => data.faults.find((f) => f.id === id);

/* ECharts 资产健康分布 */
const chartEl = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

const healthDist = computed(() =>
  Object.values(AssetHealthStatus).map((key) => ({
    key,
    name: AssetHealthStatusText[key],
    value: data.gridAssets.filter((a) => a.health_status === key).length
  }))
);

const renderChart = () => {
  if (!chartEl.value) return;
  chart ??= echarts.init(chartEl.value);
  const palette: Record<string, string> = {
    NORMAL: "#2e9e5b",
    WATCH: "#909399",
    DEGRADED: "#e6a23c",
    DANGEROUS: "#c45656"
  };
  chart.setOption({
    tooltip: { trigger: "item" },
    legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
    series: [
      {
        type: "pie",
        radius: ["46%", "70%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        label: { formatter: "{b} {c}台", fontSize: 12 },
        data: healthDist.value.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: palette[d.key] } }))
      }
    ]
  });
};

watch(healthDist, () => nextTick(renderChart), { deep: true });
onMounted(() => nextTick(renderChart));

const recentLogs = computed(() => data.auditLogs.slice(0, 8));
</script>

<template>
  <div class="grid" style="gap:16px">
    <div class="grid grid-4">
      <StatCard label="待派工工单" :value="waitDispatchCount" :sub="`待处理报修 ${data.faults.filter(f => f.status === 'PENDING').length} 张`" tone="warning" icon="Bell" />
      <StatCard label="抢修中工单" :value="activeCount" sub="已派工/到场/处理中" tone="danger" icon="Tools" />
      <StatCard label="异常健康资产" :value="abnormalAssets" :sub="`共 ${data.gridAssets.length} 台台账资产`" icon="Warning" />
      <StatCard label="平均复电时间" :value="avgRestoreDuration" sub="派工 → 复电" tone="success" icon="Timer" />
    </div>

    <div class="grid layout-side">
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2>抢修进度</h2>
            <div class="desc">待派工 → 已派工 → 已到场 → 处理中 → 已复电 → 已归档</div>
          </div>
        </div>
        <el-steps :active="1" align-center finish-status="success" simple style="margin-bottom:14px">
          <el-step v-for="s in statusFlow" :key="s.key" :title="`${s.label} ${s.count}`" />
        </el-steps>
        <EmptyState v-if="activeTickets.length === 0" text="当前没有进行中的工单" />
        <div v-for="t in activeTickets" :key="t.id" class="ticket-row">
          <div class="ticket-row-main">
            <div class="ticket-row-title">
              <el-link type="primary" @click="$router.push('/tickets')">工单 #{{ t.id }}</el-link>
              <PriorityTag :value="t.priority" />
              <StatusBadge :value="t.status" group="TicketStatus" size="small" />
              <span class="ticket-line mono">{{ ticketAsset(masterFault(t.fault_report_id)?.asset_id ?? 0)?.feeder_line }}</span>
            </div>
            <div class="ticket-row-meta">
              合并报修 {{ t.merged_report_ids.length }} 张 ·
              班组 {{ ticketCrew(t.team_id)?.name ?? "未派工" }} ·
              {{ formatDate(t.assigned_at ?? t.created_at) }}
            </div>
          </div>
          <el-button size="small" @click="$router.push('/tickets')">处置</el-button>
        </div>
      </div>

      <div class="grid" style="gap:16px">
        <div class="panel">
          <div class="panel-head"><h2>资产健康分布</h2></div>
          <div ref="chartEl" style="height: 220px"></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>班组状态</h2>
            <span class="desc">按值班状态派工</span>
          </div>
          <div class="grid" style="gap:10px">
            <CrewCard
              v-for="crew in data.crews"
              :key="crew.id"
              :crew="crew"
              :can-toggle-duty="auth.can(Action.CREW_DUTY_TOGGLE)"
              @toggle-duty="(c) => crewStore.toggleDuty(c.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="panel">
        <div class="panel-head">
          <h2>备件预警</h2>
          <el-tag size="small" type="warning" effect="plain">{{ pendingParts }} 笔待审批</el-tag>
        </div>
        <el-table :data="data.stocks" size="small">
          <el-table-column prop="part_name" label="备件" min-width="180" />
          <el-table-column prop="warehouse_name" label="仓库" width="90" />
          <el-table-column label="库存" width="110">
            <template #default="{ row }">
              <span :class="{ 'stock-warn': row.stock < row.safety_stock, 'stock-danger': row.stock <= 0 }">
                {{ row.stock }} {{ row.unit }}
              </span>
              <span v-if="row.stock < row.safety_stock" class="stock-warn">（低于安全库存 {{ row.safety_stock }}）</span>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:10px">
          <el-button text type="primary" size="small" @click="$router.push('/parts')">前往备件领用页 →</el-button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h2>最新操作记录</h2>
          <el-button text size="small" @click="$router.push('/audit')">全部审计日志</el-button>
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="log in recentLogs"
            :key="log.id"
            :timestamp="formatDate(log.created_at)"
            placement="top"
            type="success"
          >
            <el-tag size="small" effect="plain" style="margin-right:6px">{{ log.actor }}</el-tag>
            {{ log.action }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 4px; border-top: 1px solid var(--border); gap: 12px;
}
.ticket-row-title { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.ticket-line { color: var(--text-sub); font-size: 12.5px; }
.ticket-row-meta { font-size: 12.5px; color: var(--text-sub); }
</style>
