/* 前端业务引擎纯函数全流程（无 DOM 依赖；与后端 /services/engine 规则镜像） */
import { buildSeedSnapshot } from "../src/mocks/snapshot.ts";
import * as engine from "../src/api/engine.ts";

const DISPATCHER = { id: 1, name: "调度员 郑凯", role: "DISPATCHER" };
const LEADER = { id: 101, name: "周建国", role: "LEADER" };
const WAREHOUSE = { id: 201, name: "仓管员 钱敏", role: "WAREHOUSE" };

let snap = buildSeedSnapshot();
let fail = 0;
const check = (n, c, x = "") => {
  console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  " + x : ""}`);
  if (!c) fail++;
};
const mustThrow = (fn, code, n) => {
  try {
    fn();
    check(n, false, "未抛错");
  } catch (e) {
    check(n, e.code === code, e.code);
  }
};

// 1. 登记 + 同线路合并 + 跨线路拒绝
snap = engine.createFault(snap, {
  reporter_name: "测试商户", phone: "13900000099", asset_id: 3,
  fault_type: "OUTAGE", address_desc: "滨河沿街停电", severity: "URGENT", report_channel: "HOTLINE"
}, DISPATCHER);
const newId = snap.faults[0].id;
check("登记报修", snap.faults[0].status === "PENDING");
const candidates = engine.findDuplicateFaults(snap, newId).map((f) => f.id);
check("系统提示同线路重复候选", candidates.includes(4), JSON.stringify(candidates));
snap = engine.mergeFault(snap, newId, 4, DISPATCHER);
check("合并成功", snap.faults.find((f) => f.id === newId).status === "MERGED");
mustThrow(() => engine.mergeFault(snap, newId, 4, DISPATCHER), "DUPLICATE_MERGE", "重复合并被拒");

snap = engine.createFault(snap, {
  reporter_name: "跨线", phone: "13900000088", asset_id: 5,
  fault_type: "EQUIPMENT_DAMAGE", address_desc: "分支箱", severity: "URGENT", report_channel: "GRID_PATROL"
}, DISPATCHER);
const otherId = snap.faults[0].id;
mustThrow(() => engine.mergeFault(snap, otherId, 4, DISPATCHER), "VALIDATION_FAILED", "跨线路合并不允许");

// 2. 生成工单（取最高等级）
snap = engine.generateTicket(snap, 4, DISPATCHER);
const ticket = snap.tickets.find((t) => t.fault_report_id === 4);
check("生成工单含2张报修", ticket.merged_report_ids.length === 2);
check("最高等级映射HIGH", ticket.priority === "HIGH", ticket.priority);
const tid = ticket.id;
mustThrow(() => engine.generateTicket(snap, 4, DISPATCHER), "VALIDATION_FAILED", "重复生成工单被拒");

// 3. 派工：技能/值班/占用
mustThrow(() => engine.dispatchTicket(snap, tid, 3, "HIGH", DISPATCHER), "NO_AVAILABLE_CREW", "技能不匹配(班组3无环网柜)");
mustThrow(() => engine.dispatchTicket(snap, tid, 4, "HIGH", DISPATCHER), "NO_AVAILABLE_CREW", "休班班组不可派");
mustThrow(() => engine.dispatchTicket(snap, 99, 1, "HIGH", DISPATCHER), "NOT_FOUND", "不存在班组");
snap = engine.dispatchTicket(snap, tid, 2, "HIGH", DISPATCHER);
check("派工成功", snap.tickets.find((t) => t.id === tid).status === "ASSIGNED");
check("班组转BUSY", snap.crews.find((c) => c.id === 2).duty_status === "BUSY");
mustThrow(() => engine.dispatchTicket(snap, tid, 2, "HIGH", DISPATCHER), "INVALID_TRANSITION", "已派工单不可重复派工");
// 班组2被占用后，即使技能匹配也不能再派待派工单#2
mustThrow(() => engine.dispatchTicket(snap, 2, 2, "HIGH", DISPATCHER), "NO_AVAILABLE_CREW", "占用班组不可再派");

// 4. 状态流转
mustThrow(() => engine.progressTicket(snap, tid, LEADER), "INVALID_TRANSITION", "未到场不能直接处理");
snap = engine.arriveTicket(snap, tid, LEADER);
check("到场", snap.tickets.find((t) => t.id === tid).status === "ARRIVED");
snap = engine.progressTicket(snap, tid, LEADER);
check("处理中", snap.tickets.find((t) => t.id === tid).status === "REPAIRING");

// 5. 备件：申请不扣；审批才扣；驳回/超量保护
const stockBefore = snap.stocks.find((s) => s.part_code === "P-FZX-10").stock;
snap = engine.applyPart(snap, tid, "P-FZX-10", 3, LEADER);
const usageId = snap.parts[0].id;
check("申请后库存不变", snap.stocks.find((s) => s.part_code === "P-FZX-10").stock === stockBefore);
mustThrow(() => engine.applyPart(snap, tid, "P-FZX-10", 0, LEADER), "VALIDATION_FAILED", "数量非法");
snap = engine.applyPart(snap, tid, "P-FZX-10", 999, LEADER);
const bigId = snap.parts[0].id;
mustThrow(() => engine.approvePart(snap, bigId, WAREHOUSE), "PART_INSUFFICIENT_STOCK", "库存不足审批失败");
check("失败审批库存仍不变", snap.stocks.find((s) => s.part_code === "P-FZX-10").stock === stockBefore);
snap = engine.approvePart(snap, usageId, WAREHOUSE);
check("审批后扣库存", snap.stocks.find((s) => s.part_code === "P-FZX-10").stock === stockBefore - 3);
check("流水-3结余", snap.stockTxns[0].change === -3 && snap.stockTxns[0].balance === stockBefore - 3);
mustThrow(() => engine.approvePart(snap, usageId, WAREHOUSE), "PART_ALREADY_DECIDED", "重复审批拒绝");
// 消耗/归还
snap = engine.consumePart(snap, usageId, LEADER);
check("消耗状态", snap.parts.find((p) => p.id === usageId).usage_status === "CONSUMED");
snap = engine.returnPart(snap, usageId, LEADER);
check("归还回补", snap.stocks.find((s) => s.part_code === "P-FZX-10").stock === stockBefore);
check("归还流水+3", snap.stockTxns[0].change === 3);
// 待审批的不能直接消耗
mustThrow(() => engine.consumePart(snap, bigId, LEADER), "PART_PENDING_APPROVAL", "未审批不能消耗");
snap = engine.rejectPart(snap, bigId, "库存不足", WAREHOUSE);
check("驳回不动库存", snap.stocks.find((s) => s.part_code === "P-FZX-10").stock === stockBefore);

// 6. 复电联动
snap = engine.restoreTicket(snap, tid, "试送成功", LEADER);
const restored = snap.tickets.find((t) => t.id === tid);
check("工单复电", restored.status === "RESTORED" && Boolean(restored.restored_at));
check("主报修RESOLVED", snap.faults.find((f) => f.id === 4).status === "RESOLVED");
check("合并单RESOLVED", snap.faults.find((f) => f.id === newId).status === "RESOLVED");
check("资产3恢复NORMAL", snap.gridAssets.find((a) => a.id === 3).health_status === "NORMAL");
check("班组2释放", snap.crews.find((c) => c.id === 2).duty_status === "ON_DUTY" && snap.crews.find((c) => c.id === 2).current_ticket_id === null);
check("复电产生资产/工单日志", snap.auditLogs.filter((l) => l.action.includes("复电") || l.target_type === "GridAsset").length >= 2);
mustThrow(() => engine.restoreTicket(snap, tid, "x", LEADER), "INVALID_TRANSITION", "不能重复复电");
snap = engine.closeTicket(snap, tid, LEADER);
check("归档", snap.tickets.find((t) => t.id === tid).status === "CLOSED");

// 7. 审计日志覆盖每类写动作
const types = new Set(snap.auditLogs.map((l) => l.target_type));
check("日志覆盖5类实体", ["GridAsset", "FaultReport", "RepairTicket", "Crew", "SparePart"].every((t) => types.has(t)), JSON.stringify([...types]));

console.log(fail === 0 ? "\nENGINE E2E PASSED" : `\n${fail} FAILURES`);
process.exit(fail ? 1 : 0);
