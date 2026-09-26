import { describe, it, expect, beforeAll } from "vitest";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import { mount } from "@vue/test-utils";
import { useDomainStore } from "../src/stores/DomainStore";
import { useSessionStore } from "../src/stores/SessionStore";
import { useFaultReportStore } from "../src/stores/FaultReportStore";
import { useRepairTicketStore } from "../src/stores/RepairTicketStore";
import { useCrewStore } from "../src/stores/CrewStore";
import { useSparePartUsageStore } from "../src/stores/SparePartUsageStore";
import { useAuditLogStore } from "../src/stores/AuditLogStore";
import { can } from "../src/types/Role";
import DashboardPage from "../src/pages/DashboardPage.vue";
import AssetsPage from "../src/pages/AssetsPage.vue";
import FaultsPage from "../src/pages/FaultsPage.vue";
import TicketsPage from "../src/pages/TicketsPage.vue";
import PartsPage from "../src/pages/PartsPage.vue";

const pinia = createPinia();
const plugins = () => ({ global: { plugins: [pinia, ElementPlus] } });

/**
 * 说明：Element Plus el-table 依赖真实布局测量，happy-dom 下不渲染单元格内容，
 * 因此表格内行数据通过 el-table 组件的 data props 断言（业务绑定真实存在），
 * 非表格控件（按钮/标签/统计卡/树/抽屉）直接做文本断言。
 */
function tableData(wrapper: ReturnType<typeof mount>, index = 0): unknown[] {
  const tables = wrapper.findAllComponents({ name: "ElTable" });
  return (tables[index]?.props("data") as unknown[]) ?? [];
}

describe("五个业务页面真实挂载", () => {
  beforeAll(async () => {
    await useDomainStore(pinia).loadAll();
  });

  it("抢修态势页：统计卡 + 在途工单 + 班组", () => {
    const wrapper = mount(DashboardPage, plugins());
    expect(wrapper.text()).toContain("待派工工单");
    expect(wrapper.text()).toContain("平均复电时间");
    const tickets = tableData(wrapper) as { ticket_no: string }[];
    expect(tickets.some((t) => t.ticket_no === "GD-20260925-001")).toBe(true);
  });

  it("配网资产页：台账数据 + 线路资产树", () => {
    const wrapper = mount(AssetsPage, plugins());
    expect(wrapper.text()).toContain("资产台账");
    expect(wrapper.text()).toContain("线路资产树");
    expect(wrapper.text()).toContain("10kV 东风线 F01");
  });

  it("故障报修页：表格绑定报修数据 + 登记入口", () => {
    const session = useSessionStore(pinia);
    session.switchRole("DISPATCHER");
    const wrapper = mount(FaultsPage, plugins());
    expect(wrapper.text()).toContain("登记报修");
    const rows = tableData(wrapper) as { report_no: string }[];
    expect(rows.some((r) => r.report_no === "BX-20260926-009")).toBe(true);
  });

  it("抢修工单页：表格绑定工单数据 + 状态筛选", () => {
    const wrapper = mount(TicketsPage, plugins());
    expect(wrapper.text()).toContain("待派工");
    const rows = tableData(wrapper) as { ticket_no: string }[];
    expect(rows.some((r) => r.ticket_no === "GD-20260925-001")).toBe(true);
  });

  it("备件领用页：待审批数据 + 库存台账 + 流水", () => {
    const wrapper = mount(PartsPage, plugins());
    const pending = tableData(wrapper, 0) as { req_no: string }[];
    expect(pending.some((r) => r.req_no === "BJ-20260926-001")).toBe(true);
  });
});

describe("RBAC：四角色动作权限矩阵", () => {
  it("调度员独占登记/合并/派工", () => {
    expect(can("DISPATCHER", "fault:register")).toBe(true);
    expect(can("LEADER", "fault:register")).toBe(false);
    expect(can("WAREHOUSE", "ticket:dispatch")).toBe(false);
    expect(can("AUDITOR", "fault:register")).toBe(false);
  });
  it("班组长独占状态推进与备件申请", () => {
    expect(can("LEADER", "ticket:advance")).toBe(true);
    expect(can("DISPATCHER", "ticket:advance")).toBe(false);
    expect(can("LEADER", "part:apply")).toBe(true);
  });
  it("仓管独占审批与库存调整", () => {
    expect(can("WAREHOUSE", "part:approve")).toBe(true);
    expect(can("LEADER", "part:approve")).toBe(false);
    expect(can("WAREHOUSE", "stock:adjust")).toBe(true);
  });
  it("审计员仅有只读审计权限", () => {
    expect(can("AUDITOR", "audit:view")).toBe(true);
    expect(can("AUDITOR", "part:approve")).toBe(false);
  });
  it("页面写操作按钮随角色显隐", () => {
    const session = useSessionStore(pinia);
    session.switchRole("AUDITOR");
    const auditorView = mount(FaultsPage, plugins());
    expect(auditorView.text()).not.toContain("登记报修");
    session.switchRole("DISPATCHER");
    const dispatcherView = mount(FaultsPage, plugins());
    expect(dispatcherView.text()).toContain("登记报修");
  });
});

describe("store 全链路：登记→合并→生成工单→派工→流转→备件审批→复电→留痕", () => {
  it("完整跑通且四处联动一致", async () => {
    const domain = useDomainStore(pinia);
    await domain.loadAll();
    const session = useSessionStore(pinia);
    const faultStore = useFaultReportStore(pinia);
    const ticketStore = useRepairTicketStore(pinia);
    const crewStore = useCrewStore(pinia);
    const partStore = useSparePartUsageStore(pinia);
    const auditStore = useAuditLogStore(pinia);

    // 1) 调度员登记，自动分级 + 资产健康冲击
    session.switchRole("DISPATCHER");
    const created = faultStore.register({
      reporter_name: "冒烟测试", phone: "13900000000", asset_id: 9, fault_type: "TRIP",
      address_desc: "挂载冒烟测试地址", severity: "", report_channel: "HOTLINE", affected_users: 3
    });
    expect(created.severity).toBe("URGENT");
    await domain.reloadAll();

    // 2) 同线路两张并入主单 9
    faultStore.merge(10, 9);
    faultStore.merge(created.id, 9);
    // 3) 生成工单
    const { ticket_id } = faultStore.createTicket(9);
    await domain.reloadAll();
    const ticket = ticketStore.byId(ticket_id)!;
    expect(ticket.merged_report_ids).toHaveLength(2);
    expect(ticket.status).toBe("WAIT_DISPATCH");

    // 4) 派工给班组 5（SWITCH 技能、值班中）
    ticketStore.dispatch(ticket.id, 5);
    await domain.reloadAll();
    expect(ticketStore.byId(ticket.id)!.status).toBe("ASSIGNED");
    expect(crewStore.byId(5)!.duty_status).toBe("ON_SITE");

    // 5) 班组长推进到场、处理
    session.switchRole("LEADER");
    ticketStore.advance(ticket.id);
    await domain.reloadAll();
    expect(ticketStore.byId(ticket.id)!.status).toBe("ARRIVED");
    ticketStore.advance(ticket.id);
    await domain.reloadAll();
    expect(ticketStore.byId(ticket.id)!.status).toBe("REPAIRING");

    // 6) 申请备件不扣库存
    const part = partStore.parts.find((p) => p.part_code === "JJ-KG-04K-100")!;
    const stockBefore = part.stock;
    const usage = partStore.apply(ticket.id, part.id, 1);
    expect(partStore.partById(part.id)!.stock).toBe(stockBefore);

    // 7) 仓管审批才扣库存并写流水
    session.switchRole("WAREHOUSE");
    partStore.approve(usage.id);
    await domain.reloadAll();
    expect(partStore.partById(part.id)!.stock).toBe(stockBefore - 1);
    expect(partStore.ledgers.some((l) => l.ref_req_no === usage.req_no && l.change === -1)).toBe(true);

    // 8) 班组长复电（需结论）→ 故障/资产/班组三联动
    session.switchRole("LEADER");
    expect(() => ticketStore.advance(ticket.id)).toThrow();
    ticketStore.advance(ticket.id, "更换出线开关试送正常");
    await domain.reloadAll();
    expect(ticketStore.byId(ticket.id)!.status).toBe("RESTORED");
    expect(faultStore.byId(9)!.status).toBe("RESTORED");
    expect(faultStore.byId(10)!.status).toBe("MERGED");
    expect(crewStore.byId(5)!.duty_status).toBe("ON_DUTY");
    expect(crewStore.byId(5)!.current_ticket_id).toBe(null);

    // 9) 审计留痕
    await auditStore.load();
    const actions = auditStore.rows.map((l) => l.action);
    for (const code of ["fault.register", "fault.merge", "ticket.create", "ticket.dispatch", "ticket.advance", "part.apply", "part.approve", "ticket.restore", "asset.healthChange"]) {
      expect(actions).toContain(code);
    }
  });
});
