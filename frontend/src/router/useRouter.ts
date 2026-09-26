/** 轻量 hash 路由跳转（与 App.vue 的 hashchange 监听配套，前端守卫同源） */
export function useRouter() {
  function navigate(route: string) {
    window.location.hash = route;
  }
  return { navigate };
}
