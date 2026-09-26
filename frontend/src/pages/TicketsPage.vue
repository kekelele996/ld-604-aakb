<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { useFaultReportStore } from "../stores/FaultReportStore";
import { useCrewStore } from "../stores/CrewStore";
import { useGridAssetStore } from "../stores/GridAssetStore";
import { useSparePartUsageStore } from "../stores/SparePartUsageStore";
import { useDomainStore } from "../stores/DomainStore";
import { useSessionStore } from "../stores/SessionStore";
import { usePagination } from "../hooks/usePagination";
import { useTicketFlow } from "../hooks/useTicketFlow";
import { can } from "../types/Role";
import { TicketStatus, TicketStatusText } from "../constants/TicketStatus";
import { FaultTypeText, FaultTypeRequiredSkill } from "../constants/FaultType";
import { SkillTagText } from "../constants/CrewDutyStatus";
import { BusinessError } from "../constants/BusinessError";
import { formatDate, formatDuration, formatSkills } from "../utils/formatters";
import type { RepairTicket } from "../types/RepairTicket";
import type { TicketStatus as TicketStatusType } from "../types/TicketStatus";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import CrewCard from "../components/common/CrewCard.vue";
import TimelineList from "../components/common/TimelineList.vue";
import PartApplyDialog, { type PartApplyResult } from "./components/PartApplyDialog.vue";

const ticketStore = useRepairTicketStore();
const faultStore = useFaultReportStore();
const crewStore = useCrewStore();
const assetStore = useGridAssetStore();
const partStore = useSparePartUsageStore();
const domain = useDomainStore();
const session = useSessionStore();

const statusFilter = ref<"" | TicketStatusType>("");
const onlyMine = ref(false);
const filtered = computed(() =>
  ticketStore.rows.filter((ticket) => {
    if (statusFilter.value && ticket.status !== statusFilter.value) return false;
    if (onlyMine.value) {
      // 班组长视角：本班组工单 + 待派工（本地演示按署名匹配班组长姓名）
      const myCrew = crewStore.rows.find((crew) => session.user.name.includes(crew.leader_name));
      return ticket.status === "WAIT_DISPATCH" || ticket.team_id === myCrew?.id;
    }
    return true;
  })
);
const { pageRows, page, go } = usePagination(filtered, 8);

const detailVisible = ref(false);
const activeId = ref<number | null>(null);
const activeTicket = computed(() => ticketStore.byId(activeId.value));
const { timeline, nextActionText } = useTicketFlow(activeTicket);

function openDetail(ticket: RepairTicket) {
  activeId.value = ticket.id;
  detailVisible.value = true;
}
function primaryReport(ticket: RepairTicket) {
  return faultStore.byId(ticket.fault_report_id);
}
function mergedReports(ticket: RepairTicket) {
  return ticket.merged_report_ids.map((id) => faultStore.byId(id)).filter(Boolean);
}
function ticketAssets(ticket: RepairTicket) {
  return ticketStore.assetsOf(ticket);
}
function teamOf(ticket: RepairTicket) {
  return crewStore.byId(ticket.team_id);
}
function requiredSkill(ticket: RepairTicket) {
  const report = primaryReport(ticket);
  return report ? FaultTypeRequiredSkill[report.fault_type] : "OUTAGE";
}

// —— 派工 ——
const dispatchVisible = ref(false);
const selectedCrewId = ref<number | null>(null);
function openDispatch() {
  selectedCrewId.value = null;
  dispatchVisible.value = true;
}
async function confirmDispatch() {
  if (!activeTicket.value || selectedCrewId.value === null) return;
  try {
    ticketStore.dispatch(activeTicket.value.id, selectedCrewId.value);
    await domain.reloadAll();
    dispatchVisible.value = false;
    ElMessage.success("派工成功，班组状态已联动为出勤中");
  } catch (error) {
    ElMessage.error(error instanceof BusinessError ? error.message : "派工失败");
  }
}

// —— 班组长流转 / 复电 ——
async function advance() {
  if (!activeTicket.value) return;
  const ticket = activeTicket.value;
  const next = ticketStore.nextStatus(ticket);
  if (next === "RESTORED") {
    try {
      const { value } = await ElMessageBox.prompt("请填写复电处理结论（故障与资产状态将同步更新）", "复电确认", {
        confirmButtonText: "确认复电",
        cancelButtonText: "取消",
        inputType: "textarea",
        inputValidator: (text) => (!!text && !!text.trim()) || "处理结论不能为空"
      });
      ticketStore.advance(ticket.id, value);
      await domain.reloadAll();
      ElMessage.success("已复电：故障单、资产健康、班组状态同步更新");
    } catch (error) {
      if (error instanceof BusinessError) ElMessage.error(error.message);
    }
    return;
  }
  try {
    ticketStore.advance(ticket.id);
    await domain.reloadAll();
    ElMessage.success(`已推进至「${next ? TicketStatusText[next] : ""}」`);
  } catch (error) {
    ElMessage.error(error instanceof BusinessError ? error.message : "状态推进失败");
  }
}

// —— 备件申请 ——
const partApplyVisible = ref(false);
function openPartApply() {
  partApplyVisible.value = true;
}
async function onPartApplied(result: PartApplyResult) {
  partApplyVisible.value = false;
  await domain.reloadAll();
  if (result.created) ElMessage.success(`备件申请 ${result.reqNo} 已提交，等待仓管审批（审批通过才扣库存）`);
}
</script>

<template>
  <section class="panel">
    <div class="toolbar" style="margin-bottom: 14px">
      <el-radio-group v-model="statusFilter" size="small">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button v-for="status in TicketStatus" :key="status" :value="status">
          {{ TicketStatusText[status] }}
        </el-radio-button>
      </el-radio-group>
      <el-checkbox v-if="session.role === 'LEADER'" v-model="onlyMine">只看本班组相关</el-checkbox>
      <span class="spacer"></span>
      <el-tag type="danger" effect="plain">待派工 {{ ticketStore.waitingCount }}</el-tag>
      <el-tag type="warning" effect="plain">在修 {{ ticketStore.activeCount }}</el-tag>
    </div>

    <el-table :data="pageRows" size="small" border class="clickable-row" @row-click="openDetail">
      <el-table-column label="工单号" width="150">
        <template #default="{ row }"><span class="mono">{{ row.ticket_no }}</span></template>
      </el-table-column>
      <el-table-column label="主报修 / 合并" min-width="210">
        <template #default="{ row }">
          <span class="mono">{{ primaryReport(row as RepairTicket)?.report_no }}</span>
          <el-tag v-if="row.merged_report_ids.length" size="small" type="warning" effect="plain" style="margin-left: 6px">
            合并 {{ row.merged_report_ids.length }} 单
          </el-tag>
          <div class="muted" style="font-size: 12px">
            {{ primaryReport(row as RepairTicket) ? FaultTypeText[primaryReport(row as RepairTicket)!.fault_type] : "" }} ·
            {{ ticketAssets(row as RepairTicket)[0]?.feeder_line }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="优先级" width="80">
        <template #default="{ row }"><PriorityTag :value="row.priority" size="small" /></template>
      </el-table-column>
      <el-table-column label="状态" width="92">
        <template #default="{ row }"><StatusBadge kind="ticket" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="抢修班组" min-width="140">
        <template #default="{ row }">
          <span v-if="teamOf(row as RepairTicket)">{{ teamOf(row as RepairTicket)?.name }}</span>
          <el-button v-else-if="can(session.role, 'ticket:dispatch')" link type="primary" size="small" @click.stop="openDetail(row as RepairTicket)">
            去派工
          </el-button>
          <span v-else class="muted">待派工</span>
        </template>
      </el-table-column>
      <el-table-column label="派工时间" width="106">
        <template #default="{ row }">{{ formatDate(row.assigned_at) }}</template>
      </el-table-column>
      <el-table-column label="复电时间" width="106">
        <template #default="{ row }">{{ formatDate(row.restored_at) }}</template>
      </el-table-column>
      <el-table-column label="用时" width="100">
        <template #default="{ row }">{{ formatDuration(row.assigned_at, row.restored_at) }}</template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination layout="prev, pager, next" :current-page="page" :page-size="8" :total="filtered.length" @current-change="go" />
    </div>
  </section>

  <!-- 工单详情抽屉 -->
  <el-drawer v-model="detailVisible" :title="activeTicket ? `抢修工单 ${activeTicket.ticket_no}` : ''" size="640px" destroy-on-close>
    <template v-if="activeTicket">
      <div class="toolbar" style="margin-bottom: 12px">
        <StatusBadge kind="ticket" :value="activeTicket.status" />
        <PriorityTag :value="activeTicket.priority" size="small" />
        <span class="spacer"></span>
        <el-button
          v-if="activeTicket.status === 'WAIT_DISPATCH' && can(session.role, 'ticket:dispatch')"
          type="primary" size="small" @click="openDispatch"
        >派工</el-button>
        <el-button
          v-if="['ARRIVED', 'REPAIRING', 'ASSIGNED'].includes(activeTicket.status) && can(session.role, 'part:apply')"
          size="small" @click="openPartApply"
        >申请备件</el-button>
        <el-button
          v-if="activeTicket.status !== 'WAIT_DISPATCH' && activeTicket.status !== 'CLOSED' && can(session.role, 'ticket:advance')"
          type="success" size="small" @click="advance"
        >{{ nextActionText }}</el-button>
      </div>

      <el-descriptions :column="2" border size="small" style="margin-bottom: 14px">
        <el-descriptions-item label="主报修单">
          <span class="mono">{{ primaryReport(activeTicket)?.report_no }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="故障类型">
          {{ primaryReport(activeTicket) ? FaultTypeText[primaryReport(activeTicket)!.fault_type] : "" }}
        </el-descriptions-item>
        <el-descriptions-item label="抢修班组" :span="2">
          {{ teamOf(activeTicket)?.name ?? "尚未派工" }}
          <span v-if="teamOf(activeTicket)" class="muted">
            （{{ teamOf(activeTicket)?.leader_name }} · {{ formatSkills(teamOf(activeTicket)?.skill_tags ?? []) }}）
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="关联资产" :span="2">
          <el-tag v-for="asset in ticketAssets(activeTicket)" :key="asset.id" size="small" effect="plain" style="margin-right: 6px">
            {{ asset.asset_code }}｜{{ asset.feeder_line }}
            <StatusBadge kind="health" :value="asset.health_status" plain style="margin-left: 4px" />
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="mergedReports(activeTicket).length" label="合并重复报修" :span="2">
          <el-tag v-for="report in mergedReports(activeTicket)" :key="report!.id" size="small" type="warning" effect="plain" style="margin-right: 6px">
            <span class="mono">{{ report!.report_no }}</span> · {{ report!.address_desc }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="activeTicket.restore_note" label="复电结论" :span="2">
          {{ activeTicket.restore_note }}
        </el-descriptions-item>
      </el-descriptions>

      <h3>流转时间线</h3>
      <TimelineList :nodes="timeline" />

      <h3 style="margin-top: 14px">备件申请记录</h3>
      <el-table :data="partStore.usagesByTicket(activeTicket.id)" size="small" border>
        <el-table-column label="申请号" prop="req_no" width="140">
          <template #default="{ row }"><span class="mono">{{ row.req_no }}</span></template>
        </el-table-column>
        <el-table-column label="备件" min-width="160">
          <template #default="{ row }">{{ row.part_name }} × {{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="仓库" prop="warehouse_name" width="100" />
        <el-table-column label="状态" width="92">
          <template #default="{ row }">
            <StatusBadge kind="part" :value="row.usage_status" />
            <div v-if="row.approved_by" class="muted" style="font-size: 11px">{{ row.approved_by }}</div>
          </template>
        </el-table-column>
        <template #empty><span class="muted">暂无备件申请，到场后可由班组长提交</span></template>
      </el-table>
    </template>
  </el-drawer>

  <!-- 派工弹窗：技能匹配 + 值班状态 -->
  <el-dialog v-model="dispatchVisible" title="派工选择班组" width="680px" append-to-body>
    <el-alert v-if="activeTicket" type="info" :closable="false" style="margin-bottom: 12px"
      :title="`故障类型要求技能：${SkillTagText[requiredSkill(activeTicket)] ?? requiredSkill(activeTicket)}；仅值班中、技能匹配且无在做工单的班组可派工`" />
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
      <CrewCard
        v-for="crew in crewStore.rows"
        :key="crew.id"
        :crew="crew"
        :required-skill="activeTicket ? requiredSkill(activeTicket) : ''"
        selectable
        :selected="selectedCrewId === crew.id"
        @select="selectedCrewId = $event.id"
      />
    </div>
    <template #footer>
      <el-button @click="dispatchVisible = false">取消</el-button>
      <el-button type="primary" :disabled="selectedCrewId === null" @click="confirmDispatch">确认派工</el-button>
    </template>
  </el-dialog>

  <PartApplyDialog
    v-if="activeTicket"
    v-model="partApplyVisible"
    :ticket-id="activeTicket.id"
    :ticket-no="activeTicket.ticket_no"
    @applied="onPartApplied"
  />
</template>
