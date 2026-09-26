/* 六个页面 SSR 渲染冒烟：真实 Pinia + vue-router(memory) + Element Plus + 本地种子数据，
   用于在无浏览器环境捕获 setup/computed/模板插槽运行时错误。 */
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import ElementPlus from "element-plus";

// hash history 依赖浏览器 location，SSR 测试中给最小桩
globalThis.location = { href: "http://localhost/", hash: "", pathname: "/", search: "", replace() {} };
const ls = new Map();
globalThis.localStorage = {
  getItem: (k) => (ls.has(k) ? ls.get(k) : null),
  setItem: (k, v) => ls.set(k, String(v)),
  removeItem: (k) => ls.delete(k)
};

const pages = [
  ["/src/pages/DashboardPage.vue", "/dashboard"],
  ["/src/pages/AssetsPage.vue", "/assets"],
  ["/src/pages/FaultsPage.vue", "/faults"],
  ["/src/pages/TicketsPage.vue", "/tickets"],
  ["/src/pages/PartsPage.vue", "/parts"],
  ["/src/pages/AuditPage.vue", "/audit"]
];

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true },
  logLevel: "error"
});
let failures = 0;

for (const [page, path] of pages) {
  try {
    const mod = await server.ssrLoadModule(page);
    const routesMod = await server.ssrLoadModule("/src/router/routes.ts");
    const app = createSSRApp({ render: () => h(mod.default) });
    app.use(createPinia());
    const router = createRouter({ history: createMemoryHistory(), routes: routesMod.routes });
    app.use(router);
    app.use(ElementPlus);
    await router.push(path);
    await router.isReady();
    const html = await renderToString(app);
    console.log(`PASS  ${page}  (${html.length} chars)`);
  } catch (err) {
    failures++;
    console.log(`FAIL  ${page}`);
    console.log("   ", err.message);
  }
}

await server.close();
process.exit(failures ? 1 : 0);
