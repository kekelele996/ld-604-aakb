import { createRouter, createWebHashHistory } from "vue-router";
import { ElMessage } from "element-plus";
import { routes } from "./routes";
import { useAuthStore } from "../stores/authStore";

export const router = createRouter({
  // hash 路由保证 Nginx try_files 与直接访问都可用
  history: createWebHashHistory(),
  routes
});

/** 前端路由守卫：角色不匹配时拦截（与后端 rbacMiddleware 双重校验） */
router.beforeEach((to) => {
  const auth = useAuthStore();
  const roles = to.meta.roles as string[] | undefined;
  if (roles && !roles.includes(auth.role)) {
    ElMessage.error("当前角色无权访问该页面");
    return { name: "dashboard" };
  }
  return true;
});
