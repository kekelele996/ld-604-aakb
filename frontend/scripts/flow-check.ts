import { resetLocalDatabase, localDb } from "../src/mocks/localDb";
import * as faultService from "../src/services/faultReportService";
import * as ticketService from "../src/services/repairTicketService";
import * as partService from "../src/services/sparePartService";
import type { WriteContext } from "../src/services/auditService";
import { BusinessError } from "../src/constants/BusinessError";
import { createFaultReportForm } from "../src/constructors/FaultReportConstructor";

const dispatcher: WriteContext = { actor: "调度员-林调度", role: "DISPATCHER" };
const leader: WriteContext = { actor: "张建国（班组长）", role: "LEADER" };
const warehouse: WriteContext = { actor: "仓管员-周敏", role: "WAREHOUSE" };
const auditor: WriteContext = { actor: "审计员-郑审计", role: "AUDITOR" };

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${extra}`); }
}

// 0. 重置
resetLocalDatabase();

// 1. 登记报修：朝阳线再报一起 TRIP（资产 9 已有两张 PENDING 9/10）
const form = Object.assign(createFaultReportForm(), {
  reporter_name: "测试商户",
  phone: "13900000000",
  asset_id: 9,
  fault_type: "TRIP",
  address_desc: "熟食摊再次跳闸",
  severity: "" as const,
  report_channel: "HOTLINE" as const,
  affected_users: 5
});
const created = faultService.registerFaultReport(dispatcher, form);
check("登记自动分级为 URGENT", created.severity === "URGENT", created.severity);
check("登记后资产健康被冲击为 DEGRADED", localDb.gridAssets.find((a) => a.id === 9)!.health_status === "DEGRADED");
check("检测到同线路重复候选", faultService.findDuplicateCandidates(created).map((r) => r.id).includes(9));

// 2. 不同线路不能合并
let blocked = false;
try { faultService.mergeFaultReport(dispatcher, created.id, 1); } catch (e) { blocked = e instanceof BusinessError && e.code === "FAULT_MERGE_DIFFERENT_LINE"; }
check("禁止跨线路合并", blocked);

// 3. 合并到同线路主单 9（种子里 10 也是未合并 PENDING，需先并入；再并入新建 21），然后生成工单
faultService.mergeFaultReport(dispatcher, 10, 9);
faultService.mergeFaultReport(dispatcher, created.id, 9);
check("重复单状态为 MERGED", localDb.faultReports.find((r) => r.id === created.id)!.status === "MERGED");
faultService.createTicket(dispatcher, 9);
const newTicket = localDb.repairTickets.find((t) => t.fault_report_id === 9)!;
check("合并后生成工单且含 2 张重复单(10+新建)", newTicket.merged_report_ids.length === 2, String(newTicket.merged_report_ids));
check("主单状态 TICKETED", localDb.faultReports.find((r) => r.id === 9)!.status === "TICKETED");

// 4. 不能重复生成工单
blocked = false;
try { faultService.createTicket(dispatcher, 9); } catch (e) { blocked = e instanceof BusinessError && e.code === "FAULT_ALREADY_TICKETED"; }
check("主单不能重复生成工单", blocked);

// 5. 派工：TRIP 需要 SWITCH 技能
// 班组 4 休息 -> 拒绝；班组 3 无 SWITCH -> 拒绝；班组 5 有 SWITCH 且值班 -> 成功
blocked = false;
try { ticketService.dispatchTicket(dispatcher, newTicket.id, 4); } catch (e) { blocked = e instanceof BusinessError; }
check("休息班组不可派工", blocked);
blocked = false;
try { ticketService.dispatchTicket(dispatcher, newTicket.id, 3); } catch (e) { blocked = e instanceof BusinessError && e.code === "CREW_SKILL_MISMATCH"; }
check("技能不匹配不可派工", blocked);
ticketService.dispatchTicket(dispatcher, newTicket.id, 5);
check("派工后工单 ASSIGNED", newTicket.status === "ASSIGNED");
check("派工后班组变为出勤中", localDb.crews.find((c) => c.id === 5)!.duty_status === "ON_SITE");
check("已派工工单不能重复派工", (() => {
  try { ticketService.dispatchTicket(dispatcher, newTicket.id, 2); return false; } catch { return true; }
})());

// 6. RBAC：班组长不能派工/仓管不能流转
blocked = false;
try { ticketService.dispatchTicket(leader, 1, 2); } catch (e) { blocked = e instanceof BusinessError && e.code === "RBAC_DENIED"; }
check("班组长派工被 RBAC 拒绝", blocked);

// 7. 班组长推进：到场 -> 处理
ticketService.advanceTicket(leader, newTicket.id);
check("到场 ARRIVED", newTicket.status === "ARRIVED");
ticketService.advanceTicket(leader, newTicket.id);
check("处理中 REPAIRING", newTicket.status === "REPAIRING");

// 8. 备件：申请不扣库存，审批才扣
const part = localDb.spareParts.find((p) => p.part_code === "JJ-KG-04K-100")!;
const stockBefore = part.stock;
const usage = partService.applyPart(leader, newTicket.id, part.id, 2);
check("申请后库存不变", part.stock === stockBefore);
check("申请状态 PENDING", usage.usage_status === "PENDING");
blocked = false;
try { partService.approvePart(leader, usage.id); } catch (e) { blocked = e instanceof BusinessError && e.code === "RBAC_DENIED"; }
check("班组长不能审批备件", blocked);
partService.approvePart(warehouse, usage.id);
check("审批后才扣库存", part.stock === stockBefore - 2, `stock=${part.stock}`);
check("审批写了库存流水", localDb.stockLedgers.some((l) => l.ref_req_no === usage.req_no && l.change === -2));
blocked = false;
try { partService.approvePart(warehouse, usage.id); } catch (e) { blocked = e instanceof BusinessError && e.code === "PART_REQ_NOT_PENDING"; }
check("已审批不能重复审批", blocked);
// 归还 1 件回补
partService.returnPart(leader, usage.id, 1);
check("归还后库存回补 1", part.stock === stockBefore - 1);

// 9. 复电：必须填结论；复电后三联动
blocked = false;
try { ticketService.advanceTicket(leader, newTicket.id); } catch (e) { blocked = e instanceof BusinessError; }
check("复电必须填写处理结论", blocked);
ticketService.advanceTicket(leader, newTicket.id, "更换出线开关，试送正常");
check("工单 RESTORED", newTicket.status === "RESTORED");
check("主报修单同步 RESTORED", localDb.faultReports.find((r) => r.id === 9)!.status === "RESTORED");
check("合并单保持 MERGED", localDb.faultReports.find((r) => r.id === 10)!.status === "MERGED");
check("资产健康恢复 NORMAL", localDb.gridAssets.find((a) => a.id === 9)!.health_status === "NORMAL");
check("班组释放回值班", localDb.crews.find((c) => c.id === 5)!.duty_status === "ON_DUTY");
check("班组在做工单清空", localDb.crews.find((c) => c.id === 5)!.current_ticket_id === null);

// 10. 归档
ticketService.advanceTicket(leader, newTicket.id);
check("工单 CLOSED", newTicket.status === "CLOSED");

// 11. 审计员只读：任何写操作都被拒
blocked = false;
try { faultService.registerFaultReport(auditor, form); } catch (e) { blocked = e instanceof BusinessError && e.code === "RBAC_DENIED"; }
check("审计员不能登记报修", blocked);

// 12. 所有写操作留痕
const actions = localDb.auditLogs.map((l) => l.action);
for (const required of ["fault.register", "fault.merge", "ticket.create", "ticket.dispatch", "ticket.advance", "part.apply", "part.approve", "part.return", "ticket.restore", "asset.healthChange"]) {
  check(`审计日志包含 ${required}`, actions.includes(required));
}
check("日志总数 >= 20", localDb.auditLogs.length >= 20, String(localDb.auditLogs.length));

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
