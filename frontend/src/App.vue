<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { routes } from "./router/routes";
import { useSessionStore } from "./stores/SessionStore";
import { useDomainStore } from "./stores/DomainStore";
import { RoleText, type Role } from "./types/Role";
import AuditDrawer from "./components/common/AuditDrawer.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import AssetsPage from "./pages/AssetsPage.vue";
import FaultsPage from "./pages/FaultsPage.vue";
import TicketsPage from "./pages/TicketsPage.vue";
import PartsPage from "./pages/PartsPage.vue";

const session = useSessionStore();
const domain = useDomainStore();

const pageMap: Record<string, unknown> = {
  "/dashboard": DashboardPage,
  "/assets": AssetsPage,
  "/faults": FaultsPage,
  "/tickets": TicketsPage,
  "/parts": PartsPage
};

function readHash(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return routes.some((route) => route.route === hash) ? hash : "/dashboard";
}
const active = ref<string>(readHash());
window.addEventListener("hashchange", () => {
  active.value = readHash();
});

const current = computed(() => routes.find((route) => route.route === active.value) ?? routes[0]);
const currentComponent = computed(() => pageMap[active.value] ?? DashboardPage);

const auditVisible = ref(false);
const loaded = ref(false);

onMounted(async () => {
  await domain.loadAll();
  loaded.value = true;
});

function navigate(route: string) {
  window.location.hash = route;
}

async function switchRole(role: Role) {
  session.switchRole(role);
  ElMessage.success(`已切换为${RoleText[role]}视角`);
}

async function resetData() {
  try {
    await ElMessageBox.confirm("将清空所有操作并恢复初始本地数据，确定继续？", "重置本地数据", {
      type: "warning",
      confirmButtonText: "重置",
      cancelButtonText: "取消"
    });
    await domain.resetAll();
    ElMessage.success("本地数据已重置为种子状态");
  } catch {
    /* 用户取消 */
  }
}

watch(active, () => window.scrollTo({ top: 0 }));
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">
        电力配网抢修平台
        <small>GRID-REPAIR · 本地数据</small>
      </div>
      <nav>
        <button
          v-for="route in routes"
          :key="route.route"
          type="button"
          class="nav-item"
          :class="{ active: active === route.route }"
          @click="navigate(route.route)"
        >
          <el-icon><component :is="route.icon" /></el-icon>
          {{ route.name }}
        </button>
      </nav>

      <div class="role-box">
        <span class="role-title">当前角色（RBAC 视角切换）</span>
        <el-radio-group :model-value="session.role" size="small" @change="(value) => switchRole(value as Role)">
          <el-radio-button v-for="role in session.roles" :key="role.role" :value="role.role" style="margin: 2px 0">
            {{ RoleText[role.role].replace("（备件员）", "") }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </aside>

    <main class="page">
      <header class="page-head">
        <div>
          <p class="eyebrow">grid-repair / {{ current.route }}</p>
          <h1>{{ current.name }}</h1>
          <p class="muted" style="margin: 6px 0 0">{{ current.hint }}</p>
        </div>
        <div class="toolbar">
          <el-tag type="warning" effect="plain"><el-icon><User /></el-icon>&nbsp;{{ session.user.name }}</el-tag>
          <el-button @click="auditVisible = true"><el-icon><Document /></el-icon>&nbsp;审计日志</el-button>
          <el-button plain @click="resetData"><el-icon><RefreshLeft /></el-icon>&nbsp;重置数据</el-button>
        </div>
      </header>

      <component :is="currentComponent" v-if="loaded" />
      <el-skeleton v-else :rows="8" animated />
    </main>

    <AuditDrawer v-model="auditVisible" />
  </div>
</template>
