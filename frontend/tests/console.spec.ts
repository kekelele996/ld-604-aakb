import { describe, it, expect, beforeAll, vi } from "vitest";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import { mount } from "@vue/test-utils";
import * as Icons from "@element-plus/icons-vue";
import { useDomainStore } from "../src/stores/DomainStore";
import DashboardPage from "../src/pages/DashboardPage.vue";
import AssetsPage from "../src/pages/AssetsPage.vue";
import FaultsPage from "../src/pages/FaultsPage.vue";
import TicketsPage from "../src/pages/TicketsPage.vue";
import PartsPage from "../src/pages/PartsPage.vue";

describe("五页挂载无 Vue 运行时告警", () => {
  beforeAll(async () => {
    await useDomainStore(createPinia()).loadAll();
  });
  it.each([
    ["Dashboard", DashboardPage], ["Assets", AssetsPage], ["Faults", FaultsPage],
    ["Tickets", TicketsPage], ["Parts", PartsPage]
  ])("%s 挂载不抛错不告警", async (_name, Comp) => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const pinia = createPinia();
    await useDomainStore(pinia).loadAll();
    const wrapper = mount(Comp as never, { global: { plugins: [pinia, ElementPlus], components: Icons } });
    await new Promise((r) => setTimeout(r, 30));
    expect(wrapper.exists()).toBe(true);
    const warnings = spy.mock.calls.map((c) => c.join(" ")).filter((m) => m.includes("[Vue warn]") || m.includes("Extraneous"));
    expect(warnings).toEqual([]);
    expect(errorSpy.mock.calls).toEqual([]);
    spy.mockRestore();
    errorSpy.mockRestore();
  });
});
