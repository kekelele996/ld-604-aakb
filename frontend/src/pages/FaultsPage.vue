<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore } from "../stores/authStore";
import { useFaultReportStore } from "../stores/FaultReportStore";
import { Action } from "../constants/permissions";
import { FaultTypeText, FaultTypeOptions } from "../constants/FaultType";
import { SeverityText } from "../constants/Severity";
import { ReportChannelText, ReportChannelOptions } from "../constants/ReportChannel";
import { FaultStatus } from "../constants/FaultStatus";
import { formatDate, maskPhone } from "../utils/formatters";
import { createFaultReportForm, type FaultReportForm } from "../constructors/FaultReportConstructor";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import TimelineList from "../components/common/TimelineList.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { TimelineItem } from "../components/common/TimelineList.vue";
import type { FaultReport } from "../types/FaultReport";
import { findDuplicateFaults } from "../api/engine";
import type { FaultFormInput } from "../api/engine";

const data = useDataStore();
const auth = useAuthStore();
const faultStore = useFaultReportStore();
onMounted(() => data.load());

/* 筛选 */
const statusFilter = ref("");
const typeFilter = ref("");
const lineFilter = ref("");
const filtered = computed(() =>
  data.faults.filter((f) => {
    if (statusFilter.value && f.status !== statusFilter.value) return false;
    if (typeFilter.value && f.fault_type !== typeFilter.value) return false;
    if (lineFilter.value && assetOf(f.asset_id)?.feeder_line !== lineFilter.value) return false;
    return true;
  })
);
const assetOf = (id: number) => data.gridAssets.find((a) => a.id === id);
const lines = computed(() => [...new Set(data.gridAssets.map((a) => a.feeder_line))]);

/* 登记报修 */
const registerVisible = ref(false);
const form = reactive<FaultReportForm>(createFaultReportForm());

const openRegister = () => {
  Object.assign(form, createFaultReportForm());
  registerVisible.value = true;
};

const sameLineOpenFaults = computed(() => {
  if (!form.asset_id) return [];
  const line = assetOf(form.asset_id)?.feeder_line;
  return data.faults.filter(
    (f) =>
      f.status !== FaultStatus.MERGED &&
      f.status !== FaultStatus.RESOLVED &&
      f.merged_into_id === null &&
      assetOf(f.asset_id)?.feeder_line === line
  );
});

const submitRegister = async () => {
  const payload: FaultFormInput = { ...form };
  const ok = await faultStore.register(payload);
  if (ok) registerVisible.value = false;
};

/* 重复报修合并 */
const mergeVisible = ref(false);
const mergeTarget = ref<FaultReport | null>(null);
const mergeMaster = ref<number | null>(null);

const duplicateCandidates = computed(() =>
  mergeTarget.value ? findDuplicateFaults(data.snapshot, mergeTarget.value.id) : []
);

const openMerge = (row: FaultReport) => {
  mergeTarget.value = row;
  mergeMaster.value = null;
  mergeVisible.value = true;
};

const submitMerge = async () => {
  if (!mergeTarget.value || !mergeMaster.value) return;
  const ok = await faultStore.merge(mergeTarget.value.id, mergeMaster.value);
  if (ok) mergeVisible.value = false;
};

/* 生成工单 */
const generate = async (row: FaultReport) => faultStore.generateTicket(row.id);

/* 详情时间线 */
const detailVisible = ref(false);
const detailRow = ref<FaultReport | null>(null);
const detailTimeline = computed<TimelineItem[]>(() => {
  const f = detailRow.value;
  if (!f) return [];
  const ticket = data.tickets.find((t) => t.id === f.ticket_id);
  const items: TimelineItem[] = [
    { key: "create", label: `报修登记（${FaultTypeText[f.fault_type]} · ${SeverityText[f.severity]}）`, time: f.created_at, done: true, current: f.status === FaultStatus.PENDING }
  ];
  if (f.status === FaultStatus.MERGED && f.merged_into_id) {
    items.push({ key: "merge", label: `判定为同线路重复报修，并入 #${f.merged_into_id}`, done: true });
  }
  if (ticket) {
    items.push(
      { key: "ticket", label: `生成工单 #${ticket.id}`, time: ticket.created_at, done: true },
      { key: "assigned", label: "派工", time: ticket.assigned_at, done: Boolean(ticket.assigned_at) },
      { key: "arrived", label: "到场", time: ticket.arrived_at, done: Boolean(ticket.arrived_at) },
      { key: "repairing", label: "处理中", time: ticket.repairing_at, done: Boolean(ticket.repairing_at), current: ticket.status === "REPAIRING" },
      { key: "restored", label: "复电", time: ticket.restored_at, done: Boolean(ticket.restored_at) }
    );
  }
  if (f.status === FaultStatus.RESOLVED) {
    items[items.length - 1].done = true;
  }
  return items;
});

const openDetail = (row: FaultReport) => {
  detailRow.value = row;
  detailVisible.value = true;
};
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <div>
        <h2>故障报修登记与合并</h2>
        <div class="desc">同一馈线（线路）的未结报修可合并，合并后统一生成一张抢修工单</div>
      </div>
      <el-button v-if="auth.can(Action.FAULT_CREATE)" type="primary" @click="openRegister">
        <el-icon style="margin-right:4px"><Plus /></el-icon>登记报修
      </el-button>
    </div>

    <div class="toolbar">
      <el-select v-model="statusFilter" placeholder="报修状态" clearable style="width:130px">
        <el-option label="待处理" :value="FaultStatus.PENDING" />
        <el-option label="已合并" :value="FaultStatus.MERGED" />
        <el-option label="已派工" :value="FaultStatus.TICKETED" />
        <el-option label="已复电" :value="FaultStatus.RESOLVED" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="故障类型" clearable style="width:140px">
        <el-option v-for="opt in FaultTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="lineFilter" placeholder="所属线路" clearable style="width:200px">
        <el-option v-for="line in lines" :key="line" :label="line" :value="line" />
      </el-select>
    </div>

    <el-table :data="filtered" stripe>
      <el-table-column label="#" prop="id" width="50" />
      <el-table-column label="报修人 / 电话" width="150">
        <template #default="{ row }">
          {{ row.reporter_name }}
          <div class="mono" style="font-size:11.5px;color:var(--text-sub)">{{ maskPhone(row.phone) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="关联资产 / 线路" min-width="210">
        <template #default="{ row }">
          <span class="mono">{{ assetOf(row.asset_id)?.asset_code }}</span>
          <div style="font-size:12px;color:var(--text-sub)">{{ assetOf(row.asset_id)?.feeder_line }}</div>
        </template>
      </el-table-column>
      <el-table-column label="故障类型" width="100">
        <template #default="{ row }">{{ FaultTypeText[row.fault_type as keyof typeof FaultTypeText] }}</template>
      </el-table-column>
      <el-table-column label="等级" width="80">
        <template #default="{ row }"><PriorityTag :value="row.severity" variant="severity" /></template>
      </el-table-column>
      <el-table-column label="来源" width="120">
        <template #default="{ row }">{{ ReportChannelText[row.report_channel as keyof typeof ReportChannelText] }}</template>
      </el-table-column>
      <el-table-column prop="address_desc" label="地址 / 描述" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="92">
        <template #default="{ row }"><StatusBadge :value="row.status" group="FaultStatus" size="small" /></template>
      </el-table-column>
      <el-table-column label="时间" width="120">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button link size="small" @click="openDetail(row)">轨迹</el-button>
          <el-button
            v-if="auth.can(Action.FAULT_MERGE) && row.status === FaultStatus.PENDING"
            link size="small" type="warning"
            @click="openMerge(row)"
          >合并重复</el-button>
          <el-button
            v-if="auth.can(Action.FAULT_GENERATE) && row.status === FaultStatus.PENDING"
            link size="small" type="primary"
            @click="generate(row)"
          >生成工单</el-button>
          <span v-if="row.status === FaultStatus.MERGED" style="font-size:12px;color:var(--text-sub)">
            → 已并入 #{{ row.merged_into_id }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 登记报修 -->
    <el-dialog v-model="registerVisible" title="登记故障报修" width="520px">
      <el-form :model="form" label-width="92px">
        <el-form-item label="报修人" required>
          <el-input v-model="form.reporter_name" placeholder="客户姓名 / 单位" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="form.phone" placeholder="11 位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="关联资产" required>
          <el-select v-model="form.asset_id" placeholder="选择故障资产（决定线路与技能）" style="width:100%">
            <el-option
              v-for="a in data.gridAssets"
              :key="a.id"
              :label="`${a.asset_code}｜${a.feeder_line}｜${a.asset_type}`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="sameLineOpenFaults.length"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px"
          :title="`该线路已有 ${sameLineOpenFaults.length} 张未结报修，登记后可在列表中执行「合并重复」`"
        />
        <el-form-item label="故障类型">
          <el-select v-model="form.fault_type" style="width:100%">
            <el-option v-for="opt in FaultTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-radio-group v-model="form.severity">
            <el-radio-button label="NORMAL">一般</el-radio-button>
            <el-radio-button label="URGENT">紧急</el-radio-button>
            <el-radio-button label="CRITICAL">危急</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="报修来源">
          <el-select v-model="form.report_channel" style="width:100%">
            <el-option v-for="opt in ReportChannelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址描述" required>
          <el-input v-model="form.address_desc" type="textarea" :rows="2" placeholder="详细故障地址与现象" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRegister">提交登记</el-button>
      </template>
    </el-dialog>

    <!-- 合并重复报修 -->
    <el-dialog v-model="mergeVisible" title="合并同线路重复报修" width="560px">
      <template v-if="mergeTarget">
        <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
          <template #title>
            当前报修 #{{ mergeTarget.id }}（{{ assetOf(mergeTarget.asset_id)?.feeder_line }}），
            合并后不再单独派工，统一归入主报修的工单
          </template>
        </el-alert>
        <EmptyState v-if="duplicateCandidates.length === 0" text="没有可合并的同线路未结报修" />
        <el-radio-group v-else v-model="mergeMaster" style="display:flex;flex-direction:column;gap:10px">
          <el-radio
            v-for="c in duplicateCandidates"
            :key="c.id"
            :value="c.id"
            style="margin-right:0;align-items:flex-start"
          >
            <div>
              <strong>主报修 #{{ c.id }}</strong>
              <PriorityTag :value="c.severity" variant="severity" />
              <div style="font-size:12.5px;color:var(--text-sub)">
                {{ c.reporter_name }} · {{ FaultTypeText[c.fault_type as keyof typeof FaultTypeText] }} ·
                {{ c.address_desc }} · {{ formatDate(c.created_at) }}
                <span v-if="c.ticket_id"> · 已生成工单 #{{ c.ticket_id }}</span>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </template>
      <template #footer>
        <el-button @click="mergeVisible = false">取消</el-button>
        <el-button type="warning" :disabled="!mergeMaster" @click="submitMerge">确认合并</el-button>
      </template>
    </el-dialog>

    <!-- 报修处置轨迹 -->
    <el-drawer v-model="detailVisible" size="420px" :title="detailRow ? `报修 #${detailRow.id} 处置轨迹` : ''">
      <TimelineList :items="detailTimeline" />
      <EmptyState v-if="detailRow && !detailRow.ticket_id" text="尚未生成抢修工单" />
    </el-drawer>
  </div>
</template>
