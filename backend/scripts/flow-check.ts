/**
 * 后端业务服务层本地流程验证：登记 -> 同线路合并 -> 生成工单 ->
 * 派工（技能/值班校验）-> 到场/处理 -> 备件审批扣库存 -> 复电三联动 -> 归档。
 * 运行：npm run flow
 */
import { db } from "../src/repositories/inMemoryDatabase";
import { faultReportService } from "../src/services/FaultReportService";
import { repairTicketService } from "../src/services/RepairTicketService";
import { sparePartService } from "../src/services/SparePartService";
import { BusinessError } from "../src/utils/BusinessError";

const dispatcher = { actor: "调度员-林调度", role: "DISPATCHER" as const };
const leader = { actor: "张建国（班组长）", role: "LEADER" as const };
const warehouse = { actor: "仓管员-周敏", role: "WAREHOUSE" as const };
const auditor = { actor: "审计员-郑审计", role: "AUDITOR" as const };

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${extra}`); }
};

// 登记（朝阳线资产 9 与种子 9/10 同线路）
const created = faultReportService.register(dispatcher, {
  reporter_name: "测试商户", phone: "13900000000", asset_id: 9, fault_type: "TRIP",
  address_desc: "熟食摊再次跳闸", severity: "", report_channel: "HOTLINE", affected_users: 5
});
check("自动分级 URGENT", created.severity === "URGENT");
check("健康状态被冲击", db.gridAssets.find((a) => a.id === 9)!.health_status === "DEGRADED");

let blocked = false;
try { faultReportService.merge(dispatcher, created.id, 1); } catch (e) { blocked = (e as BusinessError).code === "FAULT_MERGE_DIFFERENT_LINE"; }
check("禁止跨线路合并", blocked);

faultReportService.merge(dispatcher, 10, 9);
faultReportService.merge(dispatcher, created.id, 9);
faultReportService.createTicket(dispatcher, 9);
const ticket = db.repairTickets.find((t) => t.fault_report_id === 9)!;
check("合并后工单含 2 张重复单", ticket.merged_report_ids.length === 2, String(ticket.merged_report_ids));

blocked = false;
try { repairTicketService.dispatch(dispatcher, ticket.id, 4); } catch { blocked = true; }
check("休息班组不可派工", blocked);
blocked = false;
try { repairTicketService.dispatch(dispatcher, ticket.id, 3); } catch (e) { blocked = (e as BusinessError).code === "CREW_SKILL_MISMATCH"; }
check("技能不匹配不可派工", blocked);
repairTicketService.dispatch(dispatcher, ticket.id, 5);
check("派工成功 ASSIGNED", ticket.status === "ASSIGNED");

blocked = false;
try { repairTicketService.dispatch(leader, ticket.id, 2); } catch (e) { blocked = (e as BusinessError).code === "RBAC_DENIED"; }
check("RBAC：班组长不能派工", blocked);

repairTicketService.advance(leader, ticket.id);
repairTicketService.advance(leader, ticket.id);
check("推进到 REPAIRING", ticket.status === "REPAIRING");

const part = db.spareParts.find((p) => p.part_code === "JJ-KG-04K-100")!;
const before = part.stock;
const usage = sparePartService.apply(leader, ticket.id, part.id, 2);
check("申请不扣库存", part.stock === before);
blocked = false;
try { sparePartService.approve(leader, usage.id); } catch (e) { blocked = (e as BusinessError).code === "RBAC_DENIED"; }
check("班组长不能审批", blocked);
sparePartService.approve(warehouse, usage.id);
check("审批后扣库存", part.stock === before - 2);
sparePartService.returnPart(leader, usage.id, 1);
check("归还回补", part.stock === before - 1);

blocked = false;
try { repairTicketService.advance(leader, ticket.id); } catch { blocked = true; }
check("复电必须填结论", blocked);
repairTicketService.advance(leader, ticket.id, "更换出线开关试送正常");
check("工单 RESTORED", ticket.status === "RESTORED");
check("主报修单同步 RESTORED", db.faultReports.find((r) => r.id === 9)!.status === "RESTORED");
check("合并单保持 MERGED", db.faultReports.find((r) => r.id === 10)!.status === "MERGED");
check("资产恢复 NORMAL", db.gridAssets.find((a) => a.id === 9)!.health_status === "NORMAL");
check("班组释放 ON_DUTY", db.crews.find((c) => c.id === 5)!.duty_status === "ON_DUTY");
repairTicketService.advance(leader, ticket.id);
check("归档 CLOSED", ticket.status === "CLOSED");

blocked = false;
try { faultReportService.register(auditor, { reporter_name: "x", asset_id: 9, fault_type: "TRIP", address_desc: "x" }); } catch (e) { blocked = (e as BusinessError).code === "RBAC_DENIED"; }
check("审计员只读", blocked);

const actions = db.auditLogs.map((l) => l.action);
["fault.register", "fault.merge", "ticket.create", "ticket.dispatch", "ticket.advance", "part.apply", "part.approve", "part.return", "ticket.restore", "asset.healthChange"].forEach((action) => {
  check(`日志含 ${action}`, actions.includes(action));
});

console.log(`\n后端流程：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
