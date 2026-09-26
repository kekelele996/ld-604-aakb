<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDataStore } from "../stores/dataStore";
import { AssetHealthStatusOptions, AssetHealthStatusText } from "../constants/AssetHealthStatus";
import { FaultTypeText } from "../constants/FaultType";
import { SeverityText } from "../constants/Severity";
import { formatDate, maskPhone } from "../utils/formatters";
import type { GridAsset } from "../types/GridAsset";
import type { FaultReport } from "../types/FaultReport";
import StatusBadge from "../components/common/StatusBadge.vue";
import AssetTree from "../components/common/AssetTree.vue";
import EmptyState from "../components/common/EmptyState.vue";

const data = useDataStore();
onMounted(() => data.load());

const lineFilter = ref<string>("");
const healthFilter = ref<string>("");
const keyword = ref("");

const filteredAssets = computed(() =>
  data.gridAssets.filter((a) => {
    if (lineFilter.value && a.feeder_line !== lineFilter.value) return false;
    if (healthFilter.value && a.health_status !== healthFilter.value) return false;
    if (keyword.value) {
      const k = keyword.value.trim();
      return a.asset_code.includes(k) || a.location_desc.includes(k) || a.asset_type.includes(k);
    }
    return true;
  })
);

const selectLine = (line: string) => {
  lineFilter.value = lineFilter.value === line ? "" : line;
};

/* 资产详情抽屉：历史故障 */
const drawer = ref(false);
const current = ref<GridAsset | null>(null);

const historyFaults = computed<FaultReport[]>(() =>
  current.value ? data.faults.filter((f) => f.asset_id === current.value!.id).sort((a, b) => b.created_at.localeCompare(a.created_at)) : []
);

const ownerTeam = (id: number | null) => data.crews.find((c) => c.id === id);
const faultTicket = (id: number | null) => data.tickets.find((t) => t.id === id);

const openAsset = (asset: GridAsset) => {
  current.value = asset;
  drawer.value = true;
};
</script>

<template>
  <div class="layout-side">
    <div class="panel">
      <div class="panel-head">
        <h2>线路 / 资产树</h2>
        <el-button v-if="lineFilter" link type="primary" size="small" @click="lineFilter = ''">清除筛选</el-button>
      </div>
      <AssetTree :assets="data.gridAssets" :active-line="lineFilter" @select-line="selectLine" @select-asset="openAsset" />
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索资产编号 / 类型 / 位置" clearable style="width:240px" :prefix-icon="undefined">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="healthFilter" placeholder="健康状态" clearable style="width:150px">
          <el-option v-for="opt in AssetHealthStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-tag v-if="lineFilter" closable type="success" effect="plain" @close="lineFilter = ''">线路：{{ lineFilter }}</el-tag>
        <span class="spacer"></span>
        <span class="desc" style="color:var(--text-sub);font-size:13px">共 {{ filteredAssets.length }} 台资产</span>
      </div>

      <el-table :data="filteredAssets" stripe @row-click="openAsset" row-class-name="asset-row">
        <el-table-column label="资产编号" prop="asset_code" width="160">
          <template #default="{ row }"><span class="mono">{{ row.asset_code }}</span></template>
        </el-table-column>
        <el-table-column prop="asset_type" label="设备类型" width="130" />
        <el-table-column prop="feeder_line" label="所属线路" min-width="160" />
        <el-table-column prop="voltage_level" label="电压等级" width="110" />
        <el-table-column prop="location_desc" label="位置" min-width="200" show-overflow-tooltip />
        <el-table-column label="健康状况" width="100">
          <template #default="{ row }"><StatusBadge :value="row.health_status" group="AssetHealthStatus" size="small" /></template>
        </el-table-column>
        <el-table-column label="历史故障" width="90" align="center">
          <template #default="{ row }">
            <el-badge :value="row.fault_count" :hidden="row.fault_count === 0" type="danger">
              <el-button link size="small">查看</el-button>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="责任班组" width="130">
          <template #default="{ row }">{{ ownerTeam(row.owner_team_id)?.name ?? "—" }}</template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawer" size="480px" :title="current ? `资产台账 · ${current.asset_code}` : ''">
      <template v-if="current">
        <div class="kv" style="margin-bottom:18px">
          <span class="k">设备类型</span><span>{{ current.asset_type }}</span>
          <span class="k">所属线路</span><span>{{ current.feeder_line }}</span>
          <span class="k">电压等级</span><span>{{ current.voltage_level }}</span>
          <span class="k">安装位置</span><span>{{ current.location_desc }}</span>
          <span class="k">健康状况</span><span><StatusBadge :value="current.health_status" group="AssetHealthStatus" /></span>
          <span class="k">责任班组</span><span>{{ ownerTeam(current.owner_team_id)?.name ?? "未指定" }}</span>
          <span class="k">最近故障</span><span>{{ formatDate(current.last_fault_at) }}</span>
          <span class="k">累计故障</span><span>{{ current.fault_count }} 次</span>
        </div>

        <div class="section-title">历史故障（{{ historyFaults.length }}）</div>
        <EmptyState v-if="historyFaults.length === 0" text="该资产暂无故障记录" hint="报修登记时选择资产后会自动归集" />
        <el-table v-else :data="historyFaults" size="small" border>
          <el-table-column label="#" prop="id" width="44" />
          <el-table-column label="故障类型" width="92">
            <template #default="{ row }">{{ FaultTypeText[row.fault_type as keyof typeof FaultTypeText] ?? row.fault_type }}</template>
          </el-table-column>
          <el-table-column label="等级" width="66">
            <template #default="{ row }">{{ SeverityText[row.severity as keyof typeof SeverityText] ?? row.severity }}</template>
          </el-table-column>
          <el-table-column label="报修人" width="110">
            <template #default="{ row }">{{ row.reporter_name }}<br /><span class="mono" style="font-size:11px;color:var(--text-sub)">{{ maskPhone(row.phone) }}</span></template>
          </el-table-column>
          <el-table-column label="登记时间" width="120">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="80">
            <template #default="{ row }">
              <StatusBadge :value="row.status" group="FaultStatus" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="工单" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.ticket_id" size="small" effect="plain">#{{ row.ticket_id }}</el-tag>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="historyFaults.some(f => f.ticket_id)" style="margin-top:10px;font-size:12.5px;color:var(--text-sub)">
          提示：复电后本资产健康状况会自动恢复为「{{ AssetHealthStatusText.NORMAL }}」。
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
:deep(.asset-row) { cursor: pointer; }
</style>
