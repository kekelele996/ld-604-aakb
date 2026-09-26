import { describe, it, expect, beforeAll } from "vitest";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import * as Icons from "@element-plus/icons-vue";
import { mount } from "@vue/test-utils";
import App from "../src/App.vue";
import { useSessionStore } from "../src/stores/SessionStore";

describe("应用外壳", () => {
  beforeAll(async () => {
    // App onMounted 会 loadAll，等待内部 promise
    const pinia = createPinia();
    const wrapper = mount(App, { global: { plugins: [pinia, ElementPlus], components: Icons } });
    await new Promise((r) => setTimeout(r, 200));
    (globalThis as { __w?: unknown }).__w = wrapper;
    (globalThis as { __p?: unknown }).__p = pinia;
  });

  it("渲染五个导航与角色切换器", async () => {
    const wrapper = (globalThis as { __w: ReturnType<typeof mount> }).__w;
    expect(wrapper.text()).toContain("抢修态势");
    expect(wrapper.text()).toContain("配网资产");
    expect(wrapper.text()).toContain("故障报修");
    expect(wrapper.text()).toContain("抢修工单");
    expect(wrapper.text()).toContain("备件领用");
    expect(wrapper.text()).toContain("调度员");
    expect(wrapper.text()).toContain("审计员");
  });

  it("切换角色后当前操作人更新", async () => {
    const pinia = (globalThis as { __p: ReturnType<typeof createPinia> }).__p;
    const session = useSessionStore(pinia);
    session.switchRole("WAREHOUSE");
    await new Promise((r) => setTimeout(r, 50));
    const wrapper = (globalThis as { __w: ReturnType<typeof mount> }).__w;
    expect(wrapper.text()).toContain("仓管员-周敏");
    expect(session.ctx.actor).toBe("仓管员-周敏");
  });
});
