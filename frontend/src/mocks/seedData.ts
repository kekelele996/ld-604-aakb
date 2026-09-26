import type { GridAsset } from "../types/GridAsset";
import type { FaultReport } from "../types/FaultReport";
import type { RepairTicket } from "../types/RepairTicket";
import type { Crew } from "../types/Crew";
import type { SparePart, SparePartUsage, StockLedger } from "../types/SparePartUsage";
import type { AuditLog } from "../types/AuditLog";

/**
 * 本地种子数据（禁止第三方 API）。
 * 覆盖全流程：同线路重复报修 → 合并 → 派工 → 到场 → 处理 → 备件审批扣库存 → 复电联动。
 */

export const gridAssets: GridAsset[] = [
  { id: 1, asset_code: "XL-10K-0101", asset_type: "LINE", feeder_line: "10kV 东风线 F01", voltage_level: "10kV", location_desc: "东风路 12 号杆至 38 号杆段", health_status: "DEGRADED", owner_team_id: 1, last_fault_at: "2026-09-25T20:10:00+08:00" },
  { id: 2, asset_code: "BYQ-10K-0101", asset_type: "TRANSFORMER", feeder_line: "10kV 东风线 F01", voltage_level: "10kV", location_desc: "东风小区 1# 配变 400kVA", health_status: "DANGEROUS", owner_team_id: 1, last_fault_at: "2026-09-25T20:10:00+08:00" },
  { id: 3, asset_code: "KG-10K-0102", asset_type: "SWITCH", feeder_line: "10kV 滨河线 F07", voltage_level: "10kV", location_desc: "滨河路 2# 环网柜 01 开关", health_status: "DEGRADED", owner_team_id: 2, last_fault_at: "2026-09-26T08:20:00+08:00" },
  { id: 4, asset_code: "XL-10K-0102", asset_type: "LINE", feeder_line: "10kV 滨河线 F07", voltage_level: "10kV", location_desc: "滨河大道分支箱至科技园环网柜", health_status: "WATCH", owner_team_id: 2, last_fault_at: "2026-09-26T08:20:00+08:00" },
  { id: 5, asset_code: "BYQ-10K-0303", asset_type: "TRANSFORMER", feeder_line: "10kV 南山线 F12", voltage_level: "10kV", location_desc: "南山村 3# 配变 315kVA", health_status: "WATCH", owner_team_id: 3, last_fault_at: "2026-09-26T07:05:00+08:00" },
  { id: 6, asset_code: "JL-04K-0303", asset_type: "METER", feeder_line: "10kV 南山线 F12", voltage_level: "0.4kV", location_desc: "南山村东片台区计量箱", health_status: "NORMAL", owner_team_id: 3, last_fault_at: "2026-09-24T10:00:00+08:00" },
  { id: 7, asset_code: "XL-10K-0508", asset_type: "LINE", feeder_line: "10kV 临江线 F18", voltage_level: "10kV", location_desc: "临江大道 5#-9# 杆", health_status: "DANGEROUS", owner_team_id: 4, last_fault_at: "2026-09-26T09:00:00+08:00" },
  { id: 8, asset_code: "KG-10K-0508", asset_type: "SWITCH", feeder_line: "10kV 临江线 F18", voltage_level: "10kV", location_desc: "临江排灌站柱上开关", health_status: "DANGEROUS", owner_team_id: 4, last_fault_at: "2026-09-26T09:00:00+08:00" },
  { id: 9, asset_code: "BYQ-10K-0205", asset_type: "TRANSFORMER", feeder_line: "10kV 朝阳线 F05", voltage_level: "10kV", location_desc: "朝阳市场 2# 配变 500kVA", health_status: "NORMAL", owner_team_id: 1, last_fault_at: "2026-09-20T14:00:00+08:00" },
  { id: 10, asset_code: "XL-10K-0205", asset_type: "LINE", feeder_line: "10kV 朝阳线 F05", voltage_level: "10kV", location_desc: "朝阳路主干 1#-6# 杆", health_status: "NORMAL", owner_team_id: 1, last_fault_at: null },
  { id: 11, asset_code: "DL-10K-0606", asset_type: "LINE", feeder_line: "10kV 云谷线 F22", voltage_level: "10kV", location_desc: "云谷数据中心专线电缆通道", health_status: "NORMAL", owner_team_id: 2, last_fault_at: null },
  { id: 12, asset_code: "JL-04K-0707", asset_type: "METER", feeder_line: "10kV 北苑线 F09", voltage_level: "0.4kV", location_desc: "北苑小区 6# 楼集中表箱", health_status: "NORMAL", owner_team_id: 3, last_fault_at: null }
];

export const crews: Crew[] = [
  { id: 1, name: "东风抢修一班", leader_id: 101, leader_name: "张建国", skill_tags: ["OUTAGE", "TRANSFORMER", "SWITCH"], duty_status: "ON_SITE", current_ticket_id: 4, contact_phone: "13901000001" },
  { id: 2, name: "滨河带电作业班", leader_id: 102, leader_name: "李海涛", skill_tags: ["LIVE", "SWITCH", "CABLE", "OUTAGE"], duty_status: "ON_DUTY", current_ticket_id: null, contact_phone: "13901000002" },
  { id: 3, name: "南山综合运维班", leader_id: 103, leader_name: "王立军", skill_tags: ["METER", "OUTAGE", "TRANSFORMER"], duty_status: "ON_DUTY", current_ticket_id: null, contact_phone: "13901000003" },
  { id: 4, name: "临江电缆抢修班", leader_id: 104, leader_name: "赵永刚", skill_tags: ["CABLE", "OUTAGE", "LIVE"], duty_status: "OFF_DUTY", current_ticket_id: null, contact_phone: "13901000004" },
  { id: 5, name: "朝阳机动抢修班", leader_id: 105, leader_name: "陈伟峰", skill_tags: ["OUTAGE", "SWITCH", "TRANSFORMER"], duty_status: "ON_DUTY", current_ticket_id: null, contact_phone: "13901000005" }
];

export const faultReports: FaultReport[] = [
  // —— 待派工工单来源：10kV 东风线 F01，同线路 3 张重复报修（1 主 + 2 重复）——
  { id: 1, report_no: "BX-20260925-001", reporter_name: "刘桂芳", phone: "13800100001", asset_id: 2, fault_type: "OUTAGE", address_desc: "东风小区 1 号楼整栋停电", severity: "CRITICAL", report_channel: "HOTLINE", status: "TICKETED", affected_users: 96, created_at: "2026-09-25T20:10:00+08:00", merged_into_id: null, ticket_id: 1 },
  { id: 2, report_no: "BX-20260925-002", reporter_name: "东风小区物业", phone: "13800100002", asset_id: 1, fault_type: "OUTAGE", address_desc: "东风路片区多户停电，疑似配变故障", severity: "CRITICAL", report_channel: "APP", status: "MERGED", affected_users: 0, created_at: "2026-09-25T20:14:00+08:00", merged_into_id: 1, ticket_id: 1 },
  { id: 3, report_no: "BX-20260925-003", reporter_name: "周小明", phone: "13800100003", asset_id: 1, fault_type: "EQUIPMENT_DAMAGE", address_desc: "东风小区配电房有异响和焦糊味", severity: "URGENT", report_channel: "HOTLINE", status: "MERGED", affected_users: 0, created_at: "2026-09-25T20:18:00+08:00", merged_into_id: 1, ticket_id: 1 },

  // —— 已派工、班组在途：滨河线 F07 ——
  { id: 4, report_no: "BX-20260926-004", reporter_name: "科技园值班室", phone: "13800100004", asset_id: 3, fault_type: "TRIP", address_desc: "滨河路 2# 环网柜跳闸，科技园 B 座失电", severity: "URGENT", report_channel: "PATROL", status: "TICKETED", affected_users: 42, created_at: "2026-09-26T08:20:00+08:00", merged_into_id: null, ticket_id: 2 },
  { id: 5, report_no: "BX-20260926-005", reporter_name: "吴婷婷", phone: "13800100005", asset_id: 4, fault_type: "OUTAGE", address_desc: "滨河大道沿线红绿灯停电", severity: "URGENT", report_channel: "APP", status: "MERGED", affected_users: 0, created_at: "2026-09-26T08:25:00+08:00", merged_into_id: 4, ticket_id: 2 },

  // —— 已到场：南山线 F12 低电压 ——
  { id: 6, report_no: "BX-20260926-006", reporter_name: "南山村村民", phone: "13800100006", asset_id: 5, fault_type: "VOLTAGE_LOW", address_desc: "南山村东片晚间电压低，空调无法启动", severity: "NORMAL", report_channel: "HOTLINE", status: "TICKETED", affected_users: 28, created_at: "2026-09-26T07:05:00+08:00", merged_into_id: null, ticket_id: 3 },

  // —— 处理中：临江线 F18，备件申请待仓管审批 ——
  { id: 7, report_no: "BX-20260926-007", reporter_name: "临江排灌站", phone: "13800100007", asset_id: 8, fault_type: "OUTAGE", address_desc: "排灌站专变失电，抗旱抽水中断", severity: "CRITICAL", report_channel: "ONSITE", status: "TICKETED", affected_users: 1, created_at: "2026-09-26T09:00:00+08:00", merged_into_id: null, ticket_id: 4 },
  { id: 8, report_no: "BX-20260926-008", reporter_name: "临江村村委", phone: "13800100008", asset_id: 7, fault_type: "EQUIPMENT_DAMAGE", address_desc: "临江大道倒杆断线，柱上开关烧毁", severity: "CRITICAL", report_channel: "HOTLINE", status: "MERGED", affected_users: 35, created_at: "2026-09-26T09:03:00+08:00", merged_into_id: 7, ticket_id: 4 },

  // —— 待处理 + 待合并的新报修：朝阳线 F05 同线路两张 ——
  { id: 9, report_no: "BX-20260926-009", reporter_name: "朝阳市场管理处", phone: "13800100009", asset_id: 9, fault_type: "TRIP", address_desc: "朝阳市场 2# 配变出线开关频繁跳闸", severity: "URGENT", report_channel: "APP", status: "PENDING", affected_users: 56, created_at: "2026-09-26T09:40:00+08:00", merged_into_id: null, ticket_id: null },
  { id: 10, report_no: "BX-20260926-010", reporter_name: "孙丽华", phone: "13800100010", asset_id: 9, fault_type: "TRIP", address_desc: "朝阳市场熟食摊跳闸断电，冰柜停运", severity: "URGENT", report_channel: "HOTLINE", status: "PENDING", affected_users: 0, created_at: "2026-09-26T09:47:00+08:00", merged_into_id: null, ticket_id: null },

  // —— 已复电历史：云谷线 ——
  { id: 11, report_no: "BX-20260924-011", reporter_name: "云谷数据中心", phone: "13800100011", asset_id: 11, fault_type: "SAFETY_RISK", address_desc: "专线电缆终端发热告警", severity: "URGENT", report_channel: "PATROL", status: "RESTORED", affected_users: 12, created_at: "2026-09-24T13:20:00+08:00", merged_into_id: null, ticket_id: 5 }
];

export const repairTickets: RepairTicket[] = [
  { id: 1, ticket_no: "GD-20260925-001", fault_report_id: 1, merged_report_ids: [2, 3], team_id: 5, dispatcher_id: 1, priority: "CRITICAL", status: "WAIT_DISPATCH", assigned_at: null, arrived_at: null, repairing_at: null, restored_at: null, closed_at: null, restore_note: null, created_at: "2026-09-25T20:25:00+08:00" },
  { id: 2, ticket_no: "GD-20260926-002", fault_report_id: 4, merged_report_ids: [5], team_id: 2, dispatcher_id: 1, priority: "URGENT", status: "ASSIGNED", assigned_at: "2026-09-26T08:35:00+08:00", arrived_at: null, repairing_at: null, restored_at: null, closed_at: null, restore_note: null, created_at: "2026-09-26T08:30:00+08:00" },
  { id: 3, ticket_no: "GD-20260926-003", fault_report_id: 6, merged_report_ids: [], team_id: 3, dispatcher_id: 1, priority: "NORMAL", status: "ARRIVED", assigned_at: "2026-09-26T07:20:00+08:00", arrived_at: "2026-09-26T07:48:00+08:00", repairing_at: null, restored_at: null, closed_at: null, restore_note: null, created_at: "2026-09-26T07:15:00+08:00" },
  { id: 4, ticket_no: "GD-20260926-004", fault_report_id: 7, merged_report_ids: [8], team_id: 1, dispatcher_id: 1, priority: "CRITICAL", status: "REPAIRING", assigned_at: "2026-09-26T09:15:00+08:00", arrived_at: "2026-09-26T09:52:00+08:00", repairing_at: "2026-09-26T10:05:00+08:00", restored_at: null, closed_at: null, restore_note: null, created_at: "2026-09-26T09:10:00+08:00" },
  { id: 5, ticket_no: "GD-20260924-005", fault_report_id: 11, merged_report_ids: [], team_id: 2, dispatcher_id: 1, priority: "URGENT", status: "RESTORED", assigned_at: "2026-09-24T13:40:00+08:00", arrived_at: "2026-09-24T14:10:00+08:00", repairing_at: "2026-09-24T14:15:00+08:00", restored_at: "2026-09-24T16:30:00+08:00", closed_at: null, restore_note: "更换电缆终端头并测温正常，恢复双电源供电", created_at: "2026-09-24T13:30:00+08:00" }
];

export const spareParts: SparePart[] = [
  { id: 1, part_code: "BJ-KG-10K-630", part_name: "柱上真空开关", spec: "ZW32-12/630-20", warehouse_name: "中心库", stock: 6, safety_stock: 2, unit: "台" },
  { id: 2, part_code: "BJ-BYQ-10K-400", part_name: "配电变压器", spec: "S13-M-400/10", warehouse_name: "中心库", stock: 2, safety_stock: 1, unit: "台" },
  { id: 3, part_code: "BJ-DL-10K-240", part_name: "10kV 电力电缆", spec: "YJV22-3×240", warehouse_name: "中心库", stock: 480, safety_stock: 100, unit: "米" },
  { id: 4, part_code: "BJ-ZD-10K", part_name: "电缆终端头", spec: "10kV 冷缩三芯", warehouse_name: "城东分库", stock: 18, safety_stock: 6, unit: "套" },
  { id: 5, part_code: "BJ-RDQ-04K", part_name: "低压熔断器", spec: "NT00-160A", warehouse_name: "城东分库", stock: 35, safety_stock: 10, unit: "只" },
  { id: 6, part_code: "JJ-KG-04K-100", part_name: "低压出线开关", spec: "NM1-100/3300", warehouse_name: "城东分库", stock: 4, safety_stock: 3, unit: "台" },
  { id: 7, part_code: "BJ-JK-10K-120", part_name: "绝缘架空导线", spec: "JKLYJ-120", warehouse_name: "中心库", stock: 600, safety_stock: 200, unit: "米" },
  { id: 8, part_code: "HC-FL-10K", part_name: "防雷绝缘子", spec: "HY5WS-17/50", warehouse_name: "城东分库", stock: 40, safety_stock: 12, unit: "只" }
];

export const sparePartUsages: SparePartUsage[] = [
  { id: 1, req_no: "BJ-20260926-001", ticket_id: 4, part_id: 1, part_code: "BJ-KG-10K-630", part_name: "柱上真空开关", quantity: 1, warehouse_name: "中心库", applicant: "张建国", approved_by: null, approved_at: null, usage_status: "PENDING", reject_reason: null, created_at: "2026-09-26T10:12:00+08:00" },
  { id: 2, req_no: "BJ-20260926-002", ticket_id: 4, part_id: 8, part_code: "HC-FL-10K", part_name: "防雷绝缘子", quantity: 3, warehouse_name: "城东分库", applicant: "张建国", approved_by: null, approved_at: null, usage_status: "PENDING", reject_reason: null, created_at: "2026-09-26T10:13:00+08:00" },
  { id: 3, req_no: "BJ-20260924-003", ticket_id: 5, part_id: 4, part_code: "BJ-ZD-10K", part_name: "电缆终端头", quantity: 2, warehouse_name: "城东分库", applicant: "李海涛", approved_by: "仓管员-周敏", approved_at: "2026-09-24T14:30:00+08:00", usage_status: "APPROVED", reject_reason: null, created_at: "2026-09-24T14:20:00+08:00" },
  { id: 4, req_no: "BJ-20260925-004", ticket_id: 0, part_id: 7, part_code: "BJ-JK-10K-120", part_name: "绝缘架空导线", quantity: 50, warehouse_name: "中心库", applicant: "陈伟峰", approved_by: "仓管员-周敏", approved_at: "2026-09-25T16:00:00+08:00", usage_status: "REJECTED", reject_reason: "领料工单已完工，按急修流程请重新提交申请", created_at: "2026-09-25T15:40:00+08:00" }
];

export const stockLedgers: StockLedger[] = [
  { id: 1, part_id: 4, part_code: "BJ-ZD-10K", change: -2, balance: 20, reason: "审批出库扣减", ref_req_no: "BJ-20260924-003", operator: "仓管员-周敏", created_at: "2026-09-24T14:30:00+08:00" }
];

export const auditLogs: AuditLog[] = [
  { id: 1, actor: "调度员-林调度", actor_role: "DISPATCHER", action: "fault.register", target_type: "FaultReport", target_id: "BX-20260924-011", detail: "登记故障报修 BX-20260924-011：安全隐患，线路 10kV 云谷线 F22，分级紧急，影响 12 户", created_at: "2026-09-24T13:20:00+08:00" },
  { id: 2, actor: "调度员-林调度", actor_role: "DISPATCHER", action: "ticket.create", target_type: "RepairTicket", target_id: "GD-20260924-005", detail: "报修单 BX-20260924-011（含 0 张重复单）生成抢修工单 GD-20260924-005", created_at: "2026-09-24T13:30:00+08:00" },
  { id: 3, actor: "调度员-林调度", actor_role: "DISPATCHER", action: "ticket.dispatch", target_type: "RepairTicket", target_id: "GD-20260924-005", detail: "工单 GD-20260924-005 派工至班组 滨河带电作业班（技能匹配 LIVE）", created_at: "2026-09-24T13:40:00+08:00" },
  { id: 4, actor: "李海涛", actor_role: "LEADER", action: "ticket.advance", target_type: "RepairTicket", target_id: "GD-20260924-005", detail: "工单 GD-20260924-005 状态由 已派工 推进至 已到场（到场确认）", created_at: "2026-09-24T14:10:00+08:00" },
  { id: 5, actor: "李海涛", actor_role: "LEADER", action: "part.apply", target_type: "SparePartUsage", target_id: "BJ-20260924-003", detail: "班组为工单 GD-20260924-005 提交备件申请 BJ-20260924-003：电缆终端头 × 2", created_at: "2026-09-24T14:20:00+08:00" },
  { id: 6, actor: "仓管员-周敏", actor_role: "WAREHOUSE", action: "part.approve", target_type: "SparePartUsage", target_id: "BJ-20260924-003", detail: "备件申请 BJ-20260924-003 审批通过，电缆终端头 × 2 出库并扣减库存（余额 18）", created_at: "2026-09-24T14:30:00+08:00" },
  { id: 7, actor: "李海涛", actor_role: "LEADER", action: "ticket.restore", target_type: "RepairTicket", target_id: "GD-20260924-005", detail: "工单 GD-20260924-005 确认复电，处理结论：更换电缆终端头并测温正常，恢复双电源供电；用时 2 小时 50 分", created_at: "2026-09-24T16:30:00+08:00" }
];

/** 兼容旧引用名 mockData */
export const mockData = {
  gridAsset: gridAssets,
  faultReport: faultReports,
  repairTicket: repairTickets,
  crew: crews,
  sparePartUsage: sparePartUsages,
  sparePart: spareParts,
  stockLedger: stockLedgers,
  auditLog: auditLogs
};
