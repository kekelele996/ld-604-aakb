<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore } from "../stores/authStore";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { useSparePartUsageStore } from "../stores/SparePartUsageStore";
import { Action } from "../constants/permissions";
import { TicketStatus, TicketStatusText } from "../constants/TicketStatus";
import { PriorityOptions, PriorityText } from "../constants/Priority";
import { FaultTypeText } from "../constants/FaultType";
import { SeverityText } from "../constants/Severity";
import { PartStatusText } from "../constants/PartStatus";
import { formatDate, formatDuration, stockLevelType } from "../utils/formatters";
import { useCrewAvailability } from "../hooks/useCrewAvailability";
import { useTicketFlowWithSnapshot } from "../hooks/useTicketFlow";
import { createDispatchForm, type DispatchForm } from "../constructors/RepairTicketConstructor";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import CrewCard from "../components/common/CrewCard.vue";
import TimelineList from "../components/common/TimelineList.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { RepairTicket } from "../types/RepairTicket";

const data = useDataStore();
const auth = useAuthStore();
const ticketStore = useRepairTicketStore();
const partStore = useSparePartUsageStore();
onMounted(() => data.load());

/* 列表与筛选 */
const statusFilter = ref("");
const filtered = computed(() =>
  data.tickets.filter((t) => (statusFilter.value ? t.status === statusFilter.value : true))
);
const selectedId = ref<number | null>(data.tickets[0]?.id ?? null);
watch(
  () => data.tickets.length,
  () => {
    if (selectedId.value === null && data.tickets.length) selectedId.value = data.tickets[0].id;
  }
);
const current = computed<RepairTicket | undefined>(() => data.tickets.find((t) => t.id === selectedId.value));
const selectTicket = (t: RepairTicket) => {
  selectedId.value = t.id;
};

const masterFault = computed(() => data.faults.find((f) => f.id === current.value?.fault_report_id));
const masterAsset = computed(() => data.gridAssets.find((a) => a.id === masterFault.value?.asset_id));
const crewOf = (id: number | null | undefined) => data.crews.find((c) => c.id === id);
const relatedFaults = computed(() =>
  current.value
    ? current.value.merged_report_ids.map((id) => data.faults.find((f) => f.id === id)).filter(Boolean)
    : []
);

const { timeline } = useTicketFlowWithSnapshot(current, () => data.snapshot);

/* 派工 */
const dispatchForm = reactive<DispatchForm>(createDispatchForm());
const { ranked: crewRanks } = useCrewAvailability(
  () => data.crews,
  () => masterAsset.value
);

watch(
  () => selectedId.value,
  () => {
    dispatchForm.team_id = null;
    dispatchForm.priority = current.value?.priority ?? "MEDIUM";
  },
  { immediate: true }
);

watch(
  () => current.value?.status,
  () => {
    if (current.value) dispatchForm.priority = current.value.priority;
  }
);

const dispatchHint = (crewId: number): string | undefined => {
  const rank = crewRanks.value.find((c) => c.id === crewId);
  if (!rank || rank.dispatchable) return undefined;
  return rank.reason;
};

const submitDispatch = async () => {
  if (!current.value || !dispatchForm.team_id) return;
  const ok = await ticketStore.dispatch(current.value.id, dispatchForm.team_id, dispatchForm.priority);
  if (ok) dispatchForm.team_id = null;
};

/* 状态推进 */
const arrive = () => current.value && ticketStore.arrive(current.value.id);
const startRepair = () => current.value && ticketStore.startRepair(current.value.id);

const restoreVisible = ref(false);
const restoreRemark = ref("");
const openRestore = () => {
  restoreRemark.value = "更换跌落式熔断器并试送成功，台区恢复供电";
  restoreVisible.value = true;
};
const submitRestore = async () => {
  if (!current.value) return;
  const ok = await ticketStore.restore(current.value.id, restoreRemark.value);
  if (ok) restoreVisible.value = false;
};
const close = () => current.value && ticketStore.close(current.value.id);

/* 备件申请 */
const partVisible = ref(false);
const partCode = ref("");
const partQuantity = ref(1);
const openPart = () => {
  partCode.value = data.stocks[0]?.part_code ?? "";
  partQuantity.value = 1;
  partVisible.value = true;
};
const submitPart = async () => {
  if (!current.value) return;
  const success = await partStore.apply(current.value.id, partCode.value, partQuantity.value);
  if (success) partVisible.value = false;
};

const ticketParts = computed(() =>
  current.value ? data.parts.filter((p) => p.ticket_id === current.value!.id) : []
);
const stockOf = (code: string) => data.stocks.find((s) => s.part_code === code);

/** 模板用状态判断（避免数组字面量在模板中被收窄为单值类型） */
const inFlow = (status: string) => ["ASSIGNED", "ARRIVED", "REPAIRING", "RESTORED"].includes(status);
const canApplyAtStatus = (status: string) => ["ASSIGNED", "ARRIVED", "REPAIRING"].includes(status);
const faultTypeText = (v: string) => FaultTypeText[v as keyof typeof FaultTypeText] ?? v;
const severityText = (v: string) => SeverityText[v as keyof typeof SeverityText] ?? v;
</script>

<template>
  <div class="layout-side">
    <!-- 工单列表 -->
    <div class="panel">
      <div class="panel-head">
        <h2>工单列表</h2>
        <el-select v-model="statusFilter" placeholder="全部状态" clearable size="small" style="width:120px">
          <el-option v-for="(text, key) in TicketStatusText" :key="key" :label="text" :value="key" />
        </el-select>
      </div>
      <EmptyState v-if="filtered.length === 0" text="暂无工单" />
      <div
        v-for="t in filtered"
        :key="t.id"
        class="ticket-item"
        :class="{ active: t.id === selectedId }"
        @click="selectTicket(t)"
      >
        <div class="ticket-item-head">
          <strong>#{{ t.id }}</strong>
          <PriorityTag :value="t.priority" />
          <StatusBadge :value="t.status" group="TicketStatus" size="small" />
        </div>
        <div class="ticket-item-line">
          {{ data.gridAssets.find(a => a.id === data.faults.find(f => f.id === t.fault_report_id)?.asset_id)?.feeder_line ?? "-" }}
        </div>
        <div class="ticket-item-meta">
          {{ crewOf(t.team_id)?.name ?? "待派工" }} · {{ formatDate(t.assigned_at ?? t.created_at) }}
        </div>
      </div>
    </div>

    <!-- 工单详情 -->
    <div v-if="current">
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2>工单 #{{ current.id }} 处置详情</h2>
            <div class="desc">
              合并 {{ current.merged_report_ids.length }} 张报修 · 优先级 {{ PriorityText[current.priority] }} ·
              派工 {{ formatDate(current.assigned_at) }} · 复电用时 {{ formatDuration(current.assigned_at, current.restored_at) }}
            </div>
          </div>
          <StatusBadge :value="current.status" group="TicketStatus" />
        </div>

        <!-- 待派工：调度员派工面板 -->
        <div v-if="current.status === TicketStatus.WAIT_DISPATCH && auth.can(Action.TICKET_DISPATCH)" class="dispatch-box">
          <div class="section-title">按班组技能 / 值班状态 / 备件情况派工</div>
          <el-alert
            v-if="masterAsset"
            :type="data.stocks.some(s => s.stock < s.safety_stock) ? 'warning' : 'success'"
            :closable="false" show-icon style="margin-bottom:12px"
            :title="data.stocks.some(s => s.stock < s.safety_stock)
              ? '中心仓库存在低于安全库存的备件，复杂抢修前请先与仓管确认'
              : '常用备件库存充足，可正常派工'"
          />
          <div class="crew-grid">
            <CrewCard
              v-for="rank in crewRanks"
              :key="rank.id"
              :crew="rank"
              selectable
              :selected="dispatchForm.team_id === rank.id"
              :dispatch-hint="dispatchHint(rank.id)"
              @select="(c) => (dispatchForm.team_id = c.id)"
            />
          </div>
          <div class="dispatch-foot">
            <span>派工优先级：</span>
            <el-radio-group v-model="dispatchForm.priority" size="small">
              <el-radio-button v-for="opt in PriorityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio-button>
            </el-radio-group>
            <el-button
              type="primary"
              :disabled="!dispatchForm.team_id"
              style="margin-left:auto"
              @click="submitDispatch"
            >确认派工</el-button>
          </div>
        </div>
        <el-alert
          v-else-if="current.status === TicketStatus.WAIT_DISPATCH"
          type="info" :closable="false" show-icon
          title="该工单等待调度员派工，当前角色为只读视图"
        />

        <!-- 班组流转操作 -->
        <div v-if="inFlow(current.status)" class="action-bar">
          <template v-if="current.status === TicketStatus.ASSIGNED && auth.can(Action.TICKET_ARRIVE)">
            <el-button type="primary" @click="arrive"><el-icon style="margin-right:4px"><Location /></el-icon>确认到场</el-button>
          </template>
          <template v-if="current.status === TicketStatus.ARRIVED && auth.can(Action.TICKET_PROGRESS)">
            <el-button type="primary" @click="startRepair"><el-icon style="margin-right:4px"><Tools /></el-icon>开始处理</el-button>
          </template>
          <template v-if="current.status === TicketStatus.REPAIRING">
            <el-button v-if="auth.can(Action.PART_APPLY)" @click="openPart"><el-icon style="margin-right:4px"><Box /></el-icon>申请备件</el-button>
            <el-button v-if="auth.can(Action.TICKET_RESTORE)" type="success" @click="openRestore">
              <el-icon style="margin-right:4px"><CircleCheck /></el-icon>确认复电
            </el-button>
          </template>
          <template v-if="current.status === TicketStatus.RESTORED && auth.can(Action.TICKET_CLOSE)">
            <el-button type="warning" @click="close">复电归档</el-button>
          </template>
          <span v-if="current.status !== TicketStatus.WAIT_DISPATCH" class="action-hint">
            承接班组：{{ crewOf(current.team_id)?.name ?? "-" }}
          </span>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <div class="panel">
          <div class="section-title">关联报修（含同线路合并单 {{ relatedFaults.length }} 张）</div>
          <el-table :data="relatedFaults" size="small" border>
            <el-table-column label="#" prop="id" width="44" />
            <el-table-column label="报修人" prop="reporter_name" width="90" />
            <el-table-column label="类型" width="78">
              <template #default="{ row }">{{ faultTypeText(row.fault_type) }}</template>
            </el-table-column>
            <el-table-column label="等级" width="64">
              <template #default="{ row }">{{ severityText(row.severity) }}</template>
            </el-table-column>
            <el-table-column prop="address_desc" label="描述" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }"><StatusBadge :value="row.status" group="FaultStatus" size="small" /></template>
            </el-table-column>
          </el-table>
          <div v-if="masterAsset" class="kv" style="margin-top:14px">
            <span class="k">故障资产</span><span>{{ masterAsset.asset_code }}（{{ masterAsset.asset_type }}）</span>
            <span class="k">所属线路</span><span>{{ masterAsset.feeder_line }}</span>
            <span class="k">位置</span><span>{{ masterAsset.location_desc }}</span>
            <span class="k">资产健康</span><span><StatusBadge :value="masterAsset.health_status" group="AssetHealthStatus" size="small" /></span>
          </div>
        </div>

        <div class="panel">
          <div class="section-title">处置时间线</div>
          <TimelineList :items="timeline" />
          <div v-if="current.restore_remark" style="font-size:13px;margin-top:6px">
            <span class="k" style="color:var(--text-sub)">复电说明：</span>{{ current.restore_remark }}
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top:16px">
        <div class="panel-head">
          <h2>备件领用记录</h2>
          <el-button v-if="auth.can(Action.PART_APPLY) && canApplyAtStatus(current.status)" size="small" @click="openPart">申请备件</el-button>
        </div>
        <EmptyState v-if="ticketParts.length === 0" text="暂无备件申请" hint="班组长处理中可申请备件，仓管审批通过后才扣减库存" />
        <el-table v-else :data="ticketParts" size="small" border>
          <el-table-column label="申请#" prop="id" width="64" />
          <el-table-column prop="part_name" label="备件" min-width="180" />
          <el-table-column label="数量" width="80">
            <template #default="{ row }">{{ row.quantity }} {{ stockOf(row.part_code)?.unit }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }"><StatusBadge :value="row.usage_status" group="PartStatus" size="small" /></template>
          </el-table-column>
          <el-table-column label="申请人 / 审批人" min-width="160">
            <template #default="{ row }">{{ row.requested_by }} / {{ row.approved_by ?? "待审批" }}</template>
          </el-table-column>
          <el-table-column label="时间" width="130">
            <template #default="{ row }">{{ formatDate(row.approved_at ?? row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 备件申请弹窗 -->
    <el-dialog v-model="partVisible" title="申请备件" width="440px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px"
        title="提交后进入待审批，备件员审批通过才会真正扣减库存" />
      <el-form label-width="80px">
        <el-form-item label="备件">
          <el-select v-model="partCode" style="width:100%">
            <el-option
              v-for="s in data.stocks"
              :key="s.part_code"
              :label="`${s.part_name}（库存 ${s.stock} ${s.unit}）`"
              :value="s.part_code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="partQuantity" :min="1" :max="999" />
          <span v-if="stockOf(partCode)" :class="stockLevelType(stockOf(partCode)!.stock - partQuantity, stockOf(partCode)!.safety_stock) === 'danger' ? 'stock-danger' : ''" style="margin-left:12px;font-size:12.5px;color:var(--text-sub)">
            申请后剩余 {{ Math.max(0, (stockOf(partCode)?.stock ?? 0) - partQuantity) }} {{ stockOf(partCode)?.unit }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="partVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPart">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 复电确认弹窗 -->
    <el-dialog v-model="restoreVisible" title="确认复电" width="460px">
      <el-alert type="success" :closable="false" show-icon style="margin-bottom:12px">
        <template #title>确认后将一次性联动：工单 → 已复电；关联报修（含合并单）→ 已复电；资产健康 → 正常；班组 → 值班待命</template>
      </el-alert>
      <el-input v-model="restoreRemark" type="textarea" :rows="3" placeholder="复电处置说明" />
      <template #footer>
        <el-button @click="restoreVisible = false">取消</el-button>
        <el-button type="success" @click="submitRestore">确认复电</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ticket-item { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; cursor: pointer; }
.ticket-item:hover { border-color: var(--brand); }
.ticket-item.active { border-color: var(--brand); background: var(--brand-light); box-shadow: 0 0 0 1px var(--brand); }
.ticket-item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.ticket-item-line { font-size: 13px; font-weight: 600; }
.ticket-item-meta { font-size: 12px; color: var(--text-sub); margin-top: 2px; }
.dispatch-box { border-top: 1px dashed var(--border); padding-top: 14px; }
.crew-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
.dispatch-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.action-bar { display: flex; align-items: center; gap: 10px; border-top: 1px dashed var(--border); padding-top: 14px; }
.action-hint { color: var(--text-sub); font-size: 13px; }
</style>
