<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { useGridAssetStore } from "../stores/GridAssetStore";
import { useCrewStore } from "../stores/CrewStore";
import { useDomainStore } from "../stores/DomainStore";
import { useSessionStore } from "../stores/SessionStore";
import { usePagination } from "../hooks/usePagination";
import { can } from "../types/Role";
import type { GridAsset } from "../types/GridAsset";
import type { AssetHealthStatus } from "../types/AssetHealthStatus";
import { AssetHealthStatus as HealthStatuses, AssetHealthStatusText } from "../constants/AssetHealthStatus";
import { AssetTypeText } from "../constants/AssetType";
import { FaultTypeText } from "../constants/FaultType";
import { FaultStatusText } from "../constants/FaultStatus";
import { formatDate } from "../utils/formatters";
import { BusinessError } from "../constants/BusinessError";
import AssetTree from "../components/common/AssetTree.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import EmptyState from "../components/common/EmptyState.vue";

const assetStore = useGridAssetStore();
const domain = useDomainStore();
const session = useSessionStore();

const lineFilter = ref("");
const healthFilter = ref<"" | AssetHealthStatus>("");
const keyword = ref("");
const selectedAsset = ref<GridAsset | null>(null);
const historyVisible = ref(false);

const filtered = computed(() =>
  assetStore.rows.filter(
    (asset) =>
      (!lineFilter.value || asset.feeder_line === lineFilter.value) &&
      (!healthFilter.value || asset.health_status === healthFilter.value) &&
      (!keyword.value || asset.asset_code.includes(keyword.value) || asset.location_desc.includes(keyword.value))
  )
);
const { pageRows, page, totalPages, go } = usePagination(filtered, 8);

function openHistory(asset: GridAsset) {
  selectedAsset.value = asset;
  historyVisible.value = true;
}
const historyRows = computed(() => (selectedAsset.value ? assetStore.historyFaults(selectedAsset.value.id) : []));
function teamName(teamId: number | null) {
  return useCrewStore().byId(teamId)?.name ?? "未归属";
}

async function changeHealth(asset: GridAsset, next: AssetHealthStatus) {
  try {
    await assetStore.updateHealthStatus(asset.id, next);
    await domain.reloadAll();
    ElMessage.success(`${asset.asset_code} 健康状态已更新为「${AssetHealthStatusText[next]}」`);
  } catch (error) {
    ElMessage.error(error instanceof BusinessError ? error.message : "更新失败");
  }
}
</script>

<template>
  <section class="grid-2">
    <div class="panel">
      <h2><el-icon><Search /></el-icon> 资产台账</h2>
      <div class="filter-bar">
        <el-select v-model="lineFilter" placeholder="全部线路" clearable filterable style="width: 220px">
          <el-option v-for="line in assetStore.feederLines" :key="line" :label="line" :value="line" />
        </el-select>
        <el-select v-model="healthFilter" placeholder="全部健康状况" clearable style="width: 160px">
          <el-option v-for="status in HealthStatuses" :key="status" :label="AssetHealthStatusText[status]" :value="status" />
        </el-select>
        <el-input v-model="keyword" placeholder="资产编号 / 位置" clearable style="width: 200px" />
        <span class="spacer"></span>
        <el-tag type="info" effect="plain">共 {{ filtered.length }} 项资产</el-tag>
      </div>

      <el-table :data="pageRows" size="small" border>
        <el-table-column label="资产编号" prop="asset_code" width="150">
          <template #default="{ row }"><span class="mono">{{ row.asset_code }}</span></template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ AssetTypeText[row.asset_type] ?? row.asset_type }}</template>
        </el-table-column>
        <el-table-column label="馈线 / 位置" min-width="220">
          <template #default="{ row }">
            <strong>{{ row.feeder_line }}</strong>
            <div class="muted" style="font-size: 12px">{{ row.location_desc }} · {{ row.voltage_level }}</div>
          </template>
        </el-table-column>
        <el-table-column label="健康" width="92">
          <template #default="{ row }"><StatusBadge kind="health" :value="row.health_status" /></template>
        </el-table-column>
        <el-table-column label="归属班组" width="130">
          <template #default="{ row }">{{ teamName(row.owner_team_id) }}</template>
        </el-table-column>
        <el-table-column label="最近故障" width="110">
          <template #default="{ row }">{{ formatDate(row.last_fault_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openHistory(row as GridAsset)">历史故障</el-button>
            <el-dropdown
              v-if="can(session.role, 'asset:update')"
              trigger="click"
              @command="(value: AssetHealthStatus) => changeHealth(row as GridAsset, value)"
            >
              <el-button link type="warning" size="small">改状态<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="status in HealthStatuses" :key="status" :command="status">
                    {{ AssetHealthStatusText[status] }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination layout="prev, pager, next" :current-page="page" :page-size="8" :total="filtered.length" @current-change="go" />
      </div>
    </div>

    <div class="panel">
      <h2><el-icon><Connection /></el-icon> 线路资产树</h2>
      <AssetTree :assets="filtered" :active-line="lineFilter" @select="openHistory" />
    </div>
  </section>

  <el-drawer v-model="historyVisible" :title="`历史故障 · ${selectedAsset?.asset_code ?? ''}`" size="520px">
    <dl class="kv" v-if="selectedAsset">
      <dt>馈线</dt><dd>{{ selectedAsset.feeder_line }}</dd>
      <dt>位置</dt><dd>{{ selectedAsset.location_desc }}</dd>
      <dt>健康状况</dt><dd><StatusBadge kind="health" :value="selectedAsset.health_status" /></dd>
    </dl>
    <h3 style="margin: 16px 0 8px">关联故障报修（含合并到本资产的重复报修）</h3>
    <EmptyState v-if="!historyRows.length" text="该资产暂无历史故障" />
    <el-timeline v-else>
      <el-timeline-item v-for="item in historyRows" :key="item.report.id" :timestamp="formatDate(item.report.created_at)" placement="top">
        <strong>{{ item.report.report_no }}</strong>
        <PriorityTag :value="item.report.severity" size="small" style="margin-left: 8px" />
        <StatusBadge kind="fault" :value="item.report.status" plain style="margin-left: 6px" />
        <div class="muted" style="font-size: 13px">
          {{ FaultTypeText[item.report.fault_type] }} · {{ item.report.address_desc }} · {{ item.report.affected_users }} 户
        </div>
        <div v-if="item.merged.length" class="muted" style="font-size: 12px">
          合并重复报修 {{ item.merged.length }} 单：
          <span v-for="dup in item.merged" :key="dup.id" class="mono">{{ dup.report_no }} </span>
          （{{ FaultStatusText.MERGED }}）
        </div>
      </el-timeline-item>
    </el-timeline>
  </el-drawer>
</template>
