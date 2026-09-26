<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "./router/routes";
import { RoleOptions, RoleText, type Role } from "./constants/Role";
import { useAuthStore } from "./stores/authStore";
import { useDataStore } from "./stores/dataStore";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const data = useDataStore();

onMounted(() => {
  data.load();
});

const navRoutes = computed(() => routes.filter((r) => r.meta));
const currentTitle = computed(() => (route.meta.name as string) ?? "抢修态势");

const onChangeRole = (role: Role) => {
  auth.switchRole(role);
};

const resetDemo = () => {
  data.resetDemo();
};
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">
          <span class="bolt"><el-icon><Lightning /></el-icon></span>
          <span>配网抢修工作台</span>
        </div>
        <div class="sub">GRID REPAIR · 本地数据演示</div>
      </div>
      <nav>
        <router-link
          v-for="r in navRoutes"
          :key="r.path"
          :to="r.path"
        >
          <el-icon><component :is="r.meta?.icon" /></el-icon>
          <span>{{ r.meta?.name }}</span>
        </router-link>
      </nav>
      <div class="sidebar-foot">
        调度员 / 班组长 / 仓管 / 审计员<br />四角色同库隔离演示
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="page-title">{{ currentTitle }}</div>
        <div class="top-actions">
          <el-tooltip content="恢复初始演示数据（本地内存）" placement="bottom">
            <el-button size="small" plain @click="resetDemo">
              <el-icon style="margin-right:4px"><RefreshLeft /></el-icon>重置数据
            </el-button>
          </el-tooltip>
          <el-tag type="success" effect="plain" size="small">
            <el-icon style="vertical-align:-2px"><Connection /></el-icon>
            全流程本地跑通
          </el-tag>
          <span class="role-label">当前角色</span>
          <el-select
            :model-value="auth.role"
            size="small"
            style="width: 168px"
            @change="onChangeRole"
          >
            <el-option
              v-for="opt in RoleOptions"
              :key="opt.value"
              :label="RoleText[opt.value as Role]"
              :value="opt.value"
            />
          </el-select>
          <el-avatar :size="30" style="background:#1f6b4b">
            {{ auth.user.name.slice(0, 1) }}
          </el-avatar>
        </div>
      </header>
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
