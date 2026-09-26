<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useFaultReportStore } from "../stores/FaultReportStore";
import { useGridAssetStore } from "../stores/GridAssetStore";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { useDomainStore } from "../stores/DomainStore";
import { useSessionStore } from "../stores/SessionStore";
import { usePagination } from "../hooks/usePagination";
import { can } from "../types/Role";
import { FaultType, FaultTypeText, FaultTypeDefaultSeverity, FaultTypeRequiredSkill } from "../constants/FaultType";
import { FaultStatusText, ReportChannelText, SeverityText } from "../constants/FaultStatus";
import { SkillTagText } from "../constants/CrewDutyStatus";
import { BusinessError } from "../constants/BusinessError";
import { formatDate } from "../utils/formatters";
import { createFaultReportForm, type FaultReportForm } from "../constructors/FaultReportConstructor";
import type { FaultReport } from "../types/FaultReport";
import type { FaultStatus } from "../types/FaultReport";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import EmptyState from "../components/common/EmptyState.vue";

const faultStore = useFaultReportStore();
const assetStore = useGridAssetStore();
const ticketStore = useRepairTicketStore();
const domain = useDomainStore();
const session = useSessionStore();

const statusFilter = ref<"" | FaultStatus>("");
const lineFilter = ref("");
const onlyPrimary = ref(false);

const filtered = computed(() =>
  faultStore.rows.filter((report) => {
    const asset = assetStore.byId(report.asset_id);
    if (statusFilter.value && report.status !== statusFilter.value) return false;
    if (lineFilter.value && asset?.feeder_line !== lineFilter.value) return false;
    if (onlyPrimary.value && report.merged_into_id !== null) return false;
    return true;
  })
);
const { pageRows, page, go } = usePagination(filtered, 9);

function rowClassName(data: { row: FaultReport }): string {
  return data.row.merged_into_id ? "row-merged" : "";
}

function assetOf(report: FaultReport) {
  return assetStore.byId(report.asset_id);
}
function mergedInto(report: FaultReport) {
  return report.merged_into_id ? faultStore.byId(report.merged_into_id) : null;
}
function ticketOf(report: FaultReport) {
  return report.ticket_id ? ticketStore.byId(report.ticket_id) : null;
}
function duplicatesOf(report: FaultReport) {
  return faultStore.rows.filter((row) => row.merged_into_id === report.id);
}

// —— 登记报修 ——
const registerVisible = ref(false);
const form = reactive<FaultReportForm>(createFaultReportForm());
const formRef = ref();
const formRules = {
  reporter_name: [{ required: true, message: "请填写报修人", trigger: "blur" }],
  asset_id: [{ required: true, message: "请选择故障资产", trigger: "change" }],
  address_desc: [{ required: true, message: "请填写故障地址/现象", trigger: "blur" }]
};
const autoSeverityHint = computed(() =>
  form.fault_type && !form.severity ? `将按故障类型自动分级：${SeverityText[FaultTypeDefaultSeverity[form.fault_type]]}` : ""
);
const selectedAssetLine = computed(() => (form.asset_id ? assetStore.byId(form.asset_id)?.feeder_line : ""));

function openRegister() {
  Object.assign(form, createFaultReportForm());
  registerVisible.value = true;
}
async function submitRegister() {
  await formRef.value?.validate();
  try {
    const created = faultStore.register({ ...form });
    await domain.reloadAll();
    registerVisible.value = false;
    const candidates = faultStore.duplicateCandidates(created);
    if (candidates.length) {
      try {
        await ElMessageBox.confirm(
          `同线路「${selectedAssetLine.value}」已有 ${candidates.length} 张未结报修：${candidates
            .map((row) => row.report_no)
            .join("、")}。是否立即合并？`,
          "检测到同线路重复报修",
          { confirmButtonText: "去合并", cancelButtonText: "稍后处理", type: "warning" }
        );
        statusFilter.value = "PENDING";
        lineFilter.value = selectedAssetLine.value ?? "";
        onlyPrimary.value = false;
      } catch {
        /* 调度员选择稍后处理 */
      }
    } else {
      ElMessage.success(`报修单 ${created.report_no} 登记成功，已按规则自动分级`);
    }
  } catch (error) {
    ElMessage.error(error instanceof BusinessError ? error.message : "登记失败，请检查表单");
  }
}

// —— 合并重复报修 ——
async function mergeReport(source: FaultReport) {
  const candidates = faultStore.duplicateCandidates(source);
  if (!candidates.length) {
    ElMessage.warning("没有同线路的未结主单可供合并");
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt(
      `选择合并目标主单（同线路「${assetOf(source)?.feeder_line}」），输入编号：\n${candidates
        .map((row) => `${row.report_no}｜${FaultTypeText[row.fault_type]}｜${row.address_desc}`)
        .join("\n")}`,
      `合并重复报修 ${source.report_no}`,
      {
        confirmButtonText: "确认合并",
        cancelButtonText: "取消",
        inputPlaceholder: candidates[0]?.report_no,
        inputValue: candidates[0]?.report_no
      }
    );
    const target = candidates.find((row) => row.report_no === value?.trim());
    if (!target) {
      ElMessage.error("输入的主单编号不在同线路候选中");
      return;
    }
    faultStore.merge(source.id, target.id);
    await domain.reloadAll();
    ElMessage.success(`已合并至主单 ${target.report_no}`);
  } catch (error) {
    if (error instanceof BusinessError) ElMessage.error(error.message);
  }
}

// —— 生成工单 ——
async function generateTicket(report: FaultReport) {
  try {
    const result = faultStore.createTicket(report.id);
    await domain.reloadAll();
    ElMessage.success(`已生成抢修工单 ${ticketStore.byId(result.ticket_id)?.ticket_no}，请到工单页派工`);
  } catch (error) {
    ElMessage.error(error instanceof BusinessError ? error.message : "生成工单失败");
  }
}
</script>

<template>
  <section class="panel">
    <div class="toolbar" style="margin-bottom: 14px">
      <el-select v-model="lineFilter" placeholder="全部线路" clearable filterable style="width: 210px">
        <el-option v-for="line in assetStore.feederLines" :key="line" :label="line" :value="line" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 150px">
        <el-option v-for="(text, key) in FaultStatusText" :key="key" :label="text" :value="key" />
      </el-select>
      <el-checkbox v-model="onlyPrimary">隐藏已合并重复单</el-checkbox>
      <span class="spacer"></span>
      <el-tag type="info" effect="plain">待处理主单 {{ faultStore.pendingCount }}</el-tag>
      <el-button v-if="can(session.role, 'fault:register')" type="primary" @click="openRegister">
        <el-icon><Plus /></el-icon>&nbsp;登记报修
      </el-button>
    </div>

    <el-table :data="pageRows" size="small" border :row-class-name="rowClassName">
      <el-table-column label="报修单号" width="148">
        <template #default="{ row }">
          <span class="mono">{{ row.report_no }}</span>
          <el-tag v-if="duplicatesOf(row as FaultReport).length" size="small" type="warning" effect="plain" style="margin-left: 4px">
            主单+{{ duplicatesOf(row as FaultReport).length }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="线路 / 资产" min-width="200">
        <template #default="{ row }">
          <strong>{{ assetOf(row as FaultReport)?.feeder_line }}</strong>
          <div class="muted" style="font-size: 12px">{{ assetOf(row as FaultReport)?.asset_code }} · {{ row.address_desc }}</div>
        </template>
      </el-table-column>
      <el-table-column label="故障类型" width="100">
        <template #default="{ row }">{{ FaultTypeText[row.fault_type as keyof typeof FaultTypeText] }}</template>
      </el-table-column>
      <el-table-column label="分级" width="76">
        <template #default="{ row }"><PriorityTag :value="row.severity" size="small" /></template>
      </el-table-column>
      <el-table-column label="报修人/渠道" width="150">
        <template #default="{ row }">
          {{ row.reporter_name }}
          <div class="muted" style="font-size: 12px">{{ ReportChannelText[row.report_channel as keyof typeof ReportChannelText] }} · {{ row.affected_users }} 户</div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="104">
        <template #default="{ row }"><StatusBadge kind="fault" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="登记时间" width="112">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <template v-if="row.merged_into_id">
            <el-tag type="info" effect="plain" size="small">
              已并入 <span class="mono">{{ mergedInto(row as FaultReport)?.report_no }}</span>
            </el-tag>
          </template>
          <template v-else>
            <el-button
              v-if="can(session.role, 'fault:merge') && ['PENDING', 'TICKETED'].includes(row.status)"
              link type="warning" size="small"
              @click="mergeReport(row as FaultReport)"
            >合并重复</el-button>
            <el-button
              v-if="can(session.role, 'ticket:create') && row.status === 'PENDING'"
              link type="primary" size="small"
              @click="generateTicket(row as FaultReport)"
            >生成工单</el-button>
            <span v-if="ticketOf(row as FaultReport)" class="mono muted" style="font-size: 12px">
              工单 {{ ticketOf(row as FaultReport)?.ticket_no }}
            </span>
          </template>
        </template>
      </el-table-column>
      <template #empty><EmptyState text="暂无符合条件的报修单" /></template>
    </el-table>
    <div class="pager">
      <el-pagination layout="prev, pager, next" :current-page="page" :page-size="9" :total="filtered.length" @current-change="go" />
    </div>
  </section>

  <el-dialog v-model="registerVisible" title="登记故障报修" width="520px">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
      <el-form-item label="报修人" prop="reporter_name">
        <el-input v-model="form.reporter_name" placeholder="姓名或单位" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="form.phone" placeholder="选填" />
      </el-form-item>
      <el-form-item label="故障资产" prop="asset_id">
        <el-select v-model="form.asset_id" filterable placeholder="按资产编号 / 线路选择" style="width: 100%">
          <el-option
            v-for="asset in assetStore.rows"
            :key="asset.id"
            :label="`${asset.asset_code}｜${asset.feeder_line}`"
            :value="asset.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="故障类型" prop="fault_type">
        <el-radio-group v-model="form.fault_type">
          <el-radio-button v-for="type in FaultType" :key="type" :value="type">
            {{ FaultTypeText[type] }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-alert
        :title="`该类型要求班组技能：${SkillTagText[FaultTypeRequiredSkill[form.fault_type]] ?? FaultTypeRequiredSkill[form.fault_type]}`"
        type="info" :closable="false" style="margin: 0 0 12px 96px; width: calc(100% - 96px)"
      />
      <el-form-item label="故障分级">
        <el-radio-group v-model="form.severity">
          <el-radio-button value="">自动</el-radio-button>
          <el-radio-button v-for="(text, key) in SeverityText" :key="key" :value="key">{{ text }}</el-radio-button>
        </el-radio-group>
        <div v-if="autoSeverityHint" class="muted" style="font-size: 12px">{{ autoSeverityHint }}</div>
      </el-form-item>
      <el-form-item label="报修渠道">
        <el-select v-model="form.report_channel" style="width: 180px">
          <el-option v-for="(text, key) in ReportChannelText" :key="key" :label="text" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="影响户数">
        <el-input-number v-model="form.affected_users" :min="1" :max="99999" />
      </el-form-item>
      <el-form-item label="地址/现象" prop="address_desc">
        <el-input v-model="form.address_desc" type="textarea" :rows="2" placeholder="如：xx 小区整栋停电" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="registerVisible = false">取消</el-button>
      <el-button type="primary" @click="submitRegister">登记并分级</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.row-merged) { background: #f6f5ef; color: #8a8f86; }
</style>
