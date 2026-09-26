<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore } from "../stores/authStore";
import { useSparePartUsageStore } from "../stores/SparePartUsageStore";
import { Action } from "../constants/permissions";
import { PartStatus } from "../constants/PartStatus";
import { formatDate, stockLevelType, formatNumber } from "../utils/formatters";
import ApprovalPanel from "../components/common/ApprovalPanel.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import StatCard from "../components/common/StatCard.vue";
import EmptyState from "../components/common/EmptyState.vue";

const data = useDataStore();
const auth = useAuthStore();
const partStore = useSparePartUsageStore();
onMounted(() => data.load());

const pending = computed(() => data.parts.filter((p) => p.usage_status === PartStatus.PENDING));
const lowStock = computed(() => data.stocks.filter((s) => s.stock < s.safety_stock));
const consumedCount = computed(() =>
  data.parts.filter((p) => p.usage_status === PartStatus.CONSUMED).length
);
const totalConsumedQty = computed(() =>
  data.parts.filter((p) => p.usage_status === PartStatus.CONSUMED).reduce((sum, p) => sum + p.quantity, 0)
);

const activeTab = ref("pending");

/* 仓管审批 */
const approve = async (id: number) => partStore.approve(id);
const reject = async (id: number) => {
  try {
    const { value } = await ElMessageBox.prompt("请填写驳回原因（库存不足/规格不符等）", "驳回备件申请", {
      confirmButtonText: "确认驳回",
      cancelButtonText: "取消",
      inputValue: "库存不足",
      inputValidator: (v) => Boolean(v && v.trim()) || "原因不能为空"
    });
    await partStore.reject(id, value);
  } catch {
    /* 用户取消 */
  }
};

/* 班组长：消耗 / 归还 */
const consume = (id: number) => partStore.consume(id);
const returnPart = (id: number) => partStore.returnPart(id);

/* 仓管盘点 */
const adjustingCode = ref("");
const adjustingValue = ref(0);
const openAdjust = (code: string, stock: number) => {
  adjustingCode.value = code;
  adjustingValue.value = stock;
};
const submitAdjust = async () => partStore.stockAdjust(adjustingCode.value, adjustingValue.value);

/* 消耗统计：按备件聚合 */
const consumeStats = computed(() => {
  const map = new Map<string, { part_name: string; quantity: number }>();
  data.parts.filter((p) => p.usage_status === PartStatus.CONSUMED).forEach((p) => {
    const cur = map.get(p.part_code) ?? { part_name: p.part_name, quantity: 0 };
    cur.quantity += p.quantity;
    map.set(p.part_code, cur);
  });
  return [...map.entries()].map(([part_code, v]) => ({ part_code, ...v }));
});

const ticketOf = (id: number) => data.tickets.find((t) => t.id === id);
</script>

<template>
  <div class="grid" style="gap:16px">
    <div class="grid grid-4">
      <StatCard label="待审批申请" :value="pending.length" :sub="`仓管审批后才扣库存`" tone="warning" icon="Bell" />
      <StatCard label="低库存备件" :value="lowStock.length" :sub="`共 ${data.stocks.length} 种备件`" tone="danger" icon="Warning" />
      <StatCard label="已消耗申请单" :value="consumedCount" sub="审批 → 出库 → 消耗" tone="success" icon="CircleCheck" />
      <StatCard label="累计消耗数量" :value="formatNumber(totalConsumedQty)" sub="件 / 组 / 米 / 台" icon="DataLine" />
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab">
        <!-- 待审批（仓管主视图） -->
        <el-tab-pane name="pending">
          <template #label>
            <span>待仓管审批<el-badge v-if="pending.length" :value="pending.length" type="danger" style="margin-left:6px" /></span>
          </template>
          <el-alert
            type="warning" :closable="false" show-icon style="margin-bottom:12px"
            title="业务规则：班组长提交申请不扣库存；只有仓管点「批准并出库」后才扣减库存并生成流水。"
          />
          <ApprovalPanel
            :rows="pending"
            :can-approve="auth.can(Action.PART_APPROVE)"
            @approve="approve"
            @reject="reject"
          />
          <el-alert
            v-if="!auth.can(Action.PART_APPROVE)"
            type="info" :closable="false" style="margin-top:12px"
            title="当前角色仅可查看；审批操作请切换到「仓管（备件员）」角色"
          />
        </el-tab-pane>

        <!-- 使用记录 -->
        <el-tab-pane label="领用 / 使用记录" name="records">
          <el-table :data="data.parts" stripe>
            <el-table-column label="申请#" prop="id" width="70" />
            <el-table-column label="工单" width="80">
              <template #default="{ row }">#{{ row.ticket_id }}</template>
            </el-table-column>
            <el-table-column prop="part_name" label="备件名称" min-width="190" />
            <el-table-column label="数量" width="90">
              <template #default="{ row }">{{ row.quantity }}</template>
            </el-table-column>
            <el-table-column prop="warehouse_name" label="仓库" width="100" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }"><StatusBadge :value="row.usage_status" group="PartStatus" size="small" /></template>
            </el-table-column>
            <el-table-column label="申请人" prop="requested_by" width="100" />
            <el-table-column label="审批人" width="110">
              <template #default="{ row }">{{ row.approved_by ?? "—" }}</template>
            </el-table-column>
            <el-table-column label="时间" width="130">
              <template #default="{ row }">{{ formatDate(row.approved_at ?? row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="班组长操作" width="170" fixed="right">
              <template #default="{ row }">
                <template v-if="auth.can(Action.PART_CONSUME) && row.usage_status === PartStatus.APPROVED">
                  <el-button link size="small" type="primary" @click="consume(row.id)">确认消耗</el-button>
                  <el-button link size="small" @click="returnPart(row.id)">归还</el-button>
                </template>
                <template v-else-if="auth.can(Action.PART_RETURN) && row.usage_status === PartStatus.CONSUMED">
                  <el-button link size="small" @click="returnPart(row.id)">归还回库</el-button>
                </template>
                <span v-else style="color:var(--text-sub);font-size:12px">—</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 库存台账 -->
        <el-tab-pane label="库存台账" name="stock">
          <el-table :data="data.stocks" stripe>
            <el-table-column prop="part_code" label="备件编码" width="150" class-name="mono" />
            <el-table-column prop="part_name" label="备件名称" min-width="200" />
            <el-table-column prop="warehouse_name" label="仓库" width="100" />
            <el-table-column label="当前库存" width="130">
              <template #default="{ row }">
                <span :class="{ 'stock-warn': row.stock < row.safety_stock && row.stock > 0, 'stock-danger': row.stock <= 0 }">
                  {{ row.stock }} {{ row.unit }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="safety_stock" label="安全库存" width="100">
              <template #default="{ row }">{{ row.safety_stock }} {{ row.unit }}</template>
            </el-table-column>
            <el-table-column label="水位" width="90">
              <template #default="{ row }">
                <el-tag :type="stockLevelType(row.stock, row.safety_stock)" size="small">
                  {{ row.stock <= 0 ? "缺货" : row.stock < row.safety_stock ? "偏低" : "正常" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="auth.can(Action.PART_STOCK_ADJUST)" label="盘点" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link size="small" type="primary" @click="openAdjust(row.part_code, row.stock)">调整</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 库存流水 -->
        <el-tab-pane label="库存流水" name="txns">
          <EmptyState v-if="data.stockTxns.length === 0" text="暂无库存流水" hint="审批出库与归还入库都会生成流水" />
          <el-table v-else :data="data.stockTxns" stripe>
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column prop="part_code" label="编码" width="150" class-name="mono" />
            <el-table-column prop="part_name" label="备件" min-width="180" />
            <el-table-column label="变动" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.change < 0 ? 'var(--danger)' : 'var(--brand)', fontWeight: 700 }">
                  {{ row.change > 0 ? "+" : "" }}{{ row.change }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="结余" width="90" />
            <el-table-column prop="operator" label="经手人" width="120" />
            <el-table-column prop="remark" label="说明" min-width="180" />
          </el-table>
        </el-tab-pane>

        <!-- 消耗统计 -->
        <el-tab-pane label="消耗统计" name="stats">
          <EmptyState v-if="consumeStats.length === 0" text="暂无已确认消耗的备件" hint="审批出库并由班组长确认消耗后统计" />
          <el-table v-else :data="consumeStats" stripe>
            <el-table-column prop="part_code" label="备件编码" width="180" class-name="mono" />
            <el-table-column prop="part_name" label="备件名称" min-width="220" />
            <el-table-column label="累计消耗量" width="140">
              <template #default="{ row }"><strong>{{ row.quantity }}</strong></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      :model-value="adjustingCode !== ''"
      title="库存盘点调整"
      width="400px"
      @update:model-value="(v: boolean) => !v && (adjustingCode = '')"
    >
      <el-form label-width="100px">
        <el-form-item label="备件编码"><span class="mono">{{ adjustingCode }}</span></el-form-item>
        <el-form-item label="盘点后库存">
          <el-input-number v-model="adjustingValue" :min="0" :max="99999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustingCode = ''">取消</el-button>
        <el-button type="primary" @click="submitAdjust">保存并记流水</el-button>
      </template>
    </el-dialog>
  </div>
</template>
