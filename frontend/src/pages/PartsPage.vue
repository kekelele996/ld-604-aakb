<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useSparePartUsageStore } from "../stores/SparePartUsageStore";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { useDomainStore } from "../stores/DomainStore";
import { useSessionStore } from "../stores/SessionStore";
import { usePagination } from "../hooks/usePagination";
import { can } from "../types/Role";
import { BusinessError } from "../constants/BusinessError";
import { formatDate, formatDateTimeFull } from "../utils/formatters";
import type { SparePartUsage } from "../types/SparePartUsage";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";

const partStore = useSparePartUsageStore();
const ticketStore = useRepairTicketStore();
const domain = useDomainStore();
const session = useSessionStore();

const tab = ref<"pending" | "usage" | "stock">("pending");

const pendingRows = computed(() => partStore.rows.filter((row) => row.usage_status === "PENDING"));
const historyRows = computed(() => partStore.rows.filter((row) => row.usage_status !== "PENDING"));
const { pageRows, page, go } = usePagination(historyRows, 9);

function ticketNo(usage: SparePartUsage) {
  return ticketStore.byId(usage.ticket_id)?.ticket_no ?? `历史单#${usage.ticket_id}`;
}

async function approve(usage: SparePartUsage) {
  try {
    await ElMessageBox.confirm(
      `审批通过后将立即从「${usage.warehouse_name}」出库 ${usage.part_name} × ${usage.quantity} 并扣减库存，是否继续？`,
      `备件审批 ${usage.req_no}`,
      { confirmButtonText: "审批通过并出库", cancelButtonText: "取消", type: "warning" }
    );
    partStore.approve(usage.id);
    await domain.reloadAll();
    ElMessage.success("审批通过，库存已扣减并写入流水");
  } catch (error) {
    if (error instanceof BusinessError) ElMessage.error(error.message);
  }
}

async function reject(usage: SparePartUsage) {
  try {
    const { value } = await ElMessageBox.prompt("请填写驳回原因（不扣减库存）", `驳回复件 ${usage.req_no}`, {
      confirmButtonText: "确认驳回",
      cancelButtonText: "取消",
      inputType: "textarea",
      inputValidator: (text) => (!!text && !!text.trim()) || "驳回原因不能为空"
    });
    partStore.reject(usage.id, value);
    await domain.reloadAll();
    ElMessage.success("已驳回，库存未发生变动");
  } catch (error) {
    if (error instanceof BusinessError) ElMessage.error(error.message);
  }
}

async function returnPart(usage: SparePartUsage) {
  try {
    const { value } = await ElMessageBox.prompt(`归还数量（不超过领用 ${usage.quantity}）`, `余料归还 ${usage.req_no}`, {
      confirmButtonText: "确认归还",
      cancelButtonText: "取消",
      inputValue: String(usage.quantity),
      inputValidator: (text) => (Number(text) > 0 && Number(text) <= usage.quantity) || "归还数量不合法"
    });
    partStore.returnPart(usage.id, Number(value));
    await domain.reloadAll();
    ElMessage.success("余料已归还，库存已回补");
  } catch (error) {
    if (error instanceof BusinessError) ElMessage.error(error.message);
  }
}

async function adjustStock(partId: number, current: number) {
  try {
    const { value } = await ElMessageBox.prompt("盘点后实际库存数量（自动生成调整流水）", "库存盘点调整", {
      confirmButtonText: "调整",
      cancelButtonText: "取消",
      inputValue: String(current),
      inputValidator: (text) => Number(text) >= 0 || "数量不能为负"
    });
    partStore.adjustStock(partId, Number(value));
    await domain.reloadAll();
    ElMessage.success("库存调整完成，流水已记录");
  } catch (error) {
    if (error instanceof BusinessError) ElMessage.error(error.message);
  }
}
</script>

<template>
  <section class="panel">
    <el-tabs v-model="tab">
      <!-- 待审批：仓管工作台 -->
      <el-tab-pane name="pending">
        <template #label>
          待审批 <el-badge v-if="pendingRows.length" :value="pendingRows.length" type="danger" style="margin-left: 4px" />
        </template>
        <el-alert
          v-if="session.role !== 'WAREHOUSE'"
          type="info" :closable="false" style="margin-bottom: 12px"
          title="备件员（仓管）登录后可审批；班组长仅可提交申请与归还余料"
        />
        <el-table :data="pendingRows" size="small" border>
          <el-table-column label="申请号" width="140">
            <template #default="{ row }"><span class="mono">{{ row.req_no }}</span></template>
          </el-table-column>
          <el-table-column label="工单" width="150">
            <template #default="{ row }"><span class="mono">{{ ticketNo(row as SparePartUsage) }}</span></template>
          </el-table-column>
          <el-table-column label="备件" min-width="200">
            <template #default="{ row }">
              {{ row.part_name }} <span class="muted">{{ row.part_code }}</span>
              <div class="muted" style="font-size: 12px">申请人 {{ row.applicant }} · {{ formatDate(row.created_at) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="数量/仓库" width="120">
            <template #default="{ row }">{{ row.quantity }} 件 · {{ row.warehouse_name }}</template>
          </el-table-column>
          <el-table-column label="状态" width="92">
            <template #default="{ row }"><StatusBadge kind="part" :value="row.usage_status" /></template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <template v-if="can(session.role, 'part:approve')">
                <el-button link type="success" size="small" @click="approve(row as SparePartUsage)">审批通过</el-button>
                <el-button link type="danger" size="small" @click="reject(row as SparePartUsage)">驳回</el-button>
              </template>
              <el-tag v-else type="info" effect="plain" size="small">等待备件员审批</el-tag>
            </template>
          </el-table-column>
          <template #empty><EmptyState text="没有待审批的备件申请" /></template>
        </el-table>
      </el-tab-pane>

      <!-- 领用记录 -->
      <el-tab-pane label="领用/归还记录" name="usage">
        <el-table :data="pageRows" size="small" border>
          <el-table-column label="申请号" width="140">
            <template #default="{ row }"><span class="mono">{{ row.req_no }}</span></template>
          </el-table-column>
          <el-table-column label="工单" width="150">
            <template #default="{ row }"><span class="mono">{{ ticketNo(row as SparePartUsage) }}</span></template>
          </el-table-column>
          <el-table-column label="备件" min-width="180">
            <template #default="{ row }">{{ row.part_name }} × {{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="审批人" width="130">
            <template #default="{ row }">{{ row.approved_by ?? "—" }}</template>
          </el-table-column>
          <el-table-column label="状态" width="96">
            <template #default="{ row }">
              <StatusBadge kind="part" :value="row.usage_status" />
              <div v-if="row.reject_reason" class="danger-text" style="font-size: 11px">{{ row.reject_reason }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110">
            <template #default="{ row }">
              <el-button
                v-if="row.usage_status === 'APPROVED' && can(session.role, 'part:return')"
                link type="primary" size="small" @click="returnPart(row as SparePartUsage)"
              >余料归还</el-button>
            </template>
          </el-table-column>
          <template #empty><EmptyState text="暂无领用记录" /></template>
        </el-table>
        <div class="pager">
          <el-pagination layout="prev, pager, next" :current-page="page" :page-size="9" :total="historyRows.length" @current-change="go" />
        </div>
      </el-tab-pane>

      <!-- 库存台账 + 流水 -->
      <el-tab-pane name="stock">
        <div class="grid-2">
          <div>
            <h3>备件库存台账</h3>
            <el-table :data="partStore.parts" size="small" border>
              <el-table-column label="编码" prop="part_code" width="140">
                <template #default="{ row }"><span class="mono">{{ row.part_code }}</span></template>
              </el-table-column>
              <el-table-column label="名称/规格" min-width="180">
                <template #default="{ row }">
                  {{ row.part_name }}
                  <div class="muted" style="font-size: 12px">{{ row.spec }}</div>
                </template>
              </el-table-column>
              <el-table-column label="库存" width="100">
                <template #default="{ row }">
                  <strong :class="{ 'danger-text': row.stock <= row.safety_stock }">{{ row.stock }}</strong>
                  {{ row.unit }}
                  <el-tag v-if="row.stock <= row.safety_stock" size="small" type="danger" effect="plain">低库存</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="仓库" prop="warehouse_name" width="100" />
              <el-table-column label="操作" width="90">
                <template #default="{ row }">
                  <el-button
                    v-if="can(session.role, 'stock:adjust')"
                    link type="primary" size="small" @click="adjustStock(row.id, row.stock)"
                  >盘点</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div>
            <h3>库存流水（审批扣减 / 归还回补 / 盘点调整）</h3>
            <el-table :data="partStore.ledgers" size="small" border>
              <el-table-column label="时间" width="140">
                <template #default="{ row }">{{ formatDateTimeFull(row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="备件" prop="part_code" width="130">
                <template #default="{ row }"><span class="mono">{{ row.part_code }}</span></template>
              </el-table-column>
              <el-table-column label="变动" width="80">
                <template #default="{ row }">
                  <span :class="row.change < 0 ? 'danger-text' : 'success-text'">
                    {{ row.change > 0 ? "+" : "" }}{{ row.change }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="余额" prop="balance" width="70" />
              <el-table-column label="原因/单据" min-width="160">
                <template #default="{ row }">
                  {{ row.reason }}
                  <div v-if="row.ref_req_no" class="mono muted" style="font-size: 11px">{{ row.ref_req_no }} · {{ row.operator }}</div>
                </template>
              </el-table-column>
              <template #empty><EmptyState text="暂无库存变动流水" /></template>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>
