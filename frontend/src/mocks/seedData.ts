import type { GridAsset } from "../types/GridAsset";
import type { FaultReport } from "../types/FaultReport";
import type { RepairTicket } from "../types/RepairTicket";
import type { Crew } from "../types/Crew";
import type { SparePartUsage, SparePartStock } from "../types/SparePartUsage";
import type { AuditLog, StockTxn } from "../types/Audit";
import { AssetHealthStatus } from "../constants/AssetHealthStatus";
import { FaultType } from "../constants/FaultType";
import { Severity } from "../constants/Severity";
import { ReportChannel } from "../constants/ReportChannel";
import { FaultStatus } from "../constants/FaultStatus";
import { TicketStatus } from "../constants/TicketStatus";
import { Priority } from "../constants/Priority";
import { CrewDutyStatus } from "../constants/CrewDutyStatus";
import { PartStatus } from "../constants/PartStatus";

/**
 * 全部本地种子数据（禁止第三方 API）。
 * 场景：10kV 振兴线 F12 上多起重复停电报修 → 合并成一张工单 →
 * 派工给“配电抢修一班”（技能匹配、值班待命）→ 到场 → 处理中（申请跌落式熔断器，
 * 仓管审批后才扣库存）→ 复电，同时回写报修、资产健康状态。
 */
export const gridAssets: GridAsset[] = [
  {
    id: 1,
    asset_code: "BDQ-10-F12-01",
    asset_type: "柱上断路器",
    feeder_line: "10kV 振兴线 F12",
    voltage_level: "10kV",
    location_desc: "振兴路与人民大道交叉口 23 号杆",
    health_status: AssetHealthStatus.DEGRADED,
    owner_team_id: 1,
    last_fault_at: "2026-09-26T08:12:00+08:00",
    fault_count: 2
  },
  {
    id: 2,
    asset_code: "BYQ-10-F12-07",
    asset_type: "柱上变压器",
    feeder_line: "10kV 振兴线 F12",
    voltage_level: "10kV/0.4kV",
    location_desc: "振兴小区 2 期配电房外 7 号台架",
    health_status: AssetHealthStatus.DANGEROUS,
    owner_team_id: 1,
    last_fault_at: "2026-09-26T08:05:00+08:00",
    fault_count: 3
  },
  {
    id: 3,
    asset_code: "HWG-10-F08-03",
    asset_type: "环网柜",
    feeder_line: "10kV 滨河线 F08",
    voltage_level: "10kV",
    location_desc: "滨河公园北门环网柜",
    health_status: AssetHealthStatus.WATCH,
    owner_team_id: 2,
    last_fault_at: "2026-08-30T15:20:00+08:00",
    fault_count: 1
  },
  {
    id: 4,
    asset_code: "XL-04-F08-21",
    asset_type: "低压架空线路",
    feeder_line: "10kV 滨河线 F08",
    voltage_level: "0.4kV",
    location_desc: "滨河新村 21 号杆接户线",
    health_status: AssetHealthStatus.NORMAL,
    owner_team_id: 2,
    last_fault_at: null,
    fault_count: 0
  },
  {
    id: 5,
    asset_code: "FZX-10-F21-05",
    asset_type: "分支箱",
    feeder_line: "10kV 工业园线 F21",
    voltage_level: "10kV",
    location_desc: "工业园北区 5 号分支箱",
    health_status: AssetHealthStatus.NORMAL,
    owner_team_id: 3,
    last_fault_at: null,
    fault_count: 0
  },
  {
    id: 6,
    asset_code: "DRQ-10-F12-11",
    asset_type: "跌落式熔断器",
    feeder_line: "10kV 振兴线 F12",
    voltage_level: "10kV",
    location_desc: "振兴小区 2 期 11 号杆",
    health_status: AssetHealthStatus.DEGRADED,
    owner_team_id: 1,
    last_fault_at: "2026-09-20T19:40:00+08:00",
    fault_count: 2
  }
];

export const crews: Crew[] = [
  {
    id: 1,
    name: "配电抢修一班",
    leader_id: 101,
    leader_name: "周建国",
    skill_tags: "架空线路,柱上变压器,跌落式熔断器",
    duty_status: CrewDutyStatus.BUSY,
    current_ticket_id: 1,
    contact_phone: "13900000101"
  },
  {
    id: 2,
    name: "配电抢修二班",
    leader_id: 102,
    leader_name: "李卫东",
    skill_tags: "电缆,环网柜,分支箱",
    duty_status: CrewDutyStatus.ON_DUTY,
    current_ticket_id: null,
    contact_phone: "13900000102"
  },
  {
    id: 3,
    name: "用电检查班",
    leader_id: 103,
    leader_name: "王海涛",
    skill_tags: "计量装置,接户线,低电压治理",
    duty_status: CrewDutyStatus.ON_DUTY,
    current_ticket_id: null,
    contact_phone: "13900000103"
  },
  {
    id: 4,
    name: "带电作业班",
    leader_id: 104,
    leader_name: "赵志强",
    skill_tags: "带电作业,柱上断路器,架空线路",
    duty_status: CrewDutyStatus.OFF_DUTY,
    current_ticket_id: null,
    contact_phone: "13900000104"
  }
];

export const faultReports: FaultReport[] = [
  {
    id: 1,
    reporter_name: "刘桂芳",
    phone: "13805310001",
    asset_id: 2,
    fault_type: FaultType.OUTAGE,
    address_desc: "振兴小区 2 期 7 栋整栋停电",
    severity: Severity.CRITICAL,
    report_channel: ReportChannel.HOTLINE,
    status: FaultStatus.TICKETED,
    merged_into_id: null,
    ticket_id: 1,
    created_at: "2026-09-26T08:05:00+08:00"
  },
  {
    id: 2,
    reporter_name: "陈明亮",
    phone: "13805310002",
    asset_id: 1,
    fault_type: FaultType.OUTAGE,
    address_desc: "人民大道沿线商铺全部没电",
    severity: Severity.URGENT,
    report_channel: ReportChannel.APP,
    status: FaultStatus.MERGED,
    merged_into_id: 1,
    ticket_id: 1,
    created_at: "2026-09-26T08:09:00+08:00"
  },
  {
    id: 3,
    reporter_name: "振兴物业",
    phone: "13805310003",
    asset_id: 6,
    fault_type: FaultType.TRIP,
    address_desc: "小区二期跌落保险冒火后跳闸",
    severity: Severity.URGENT,
    report_channel: ReportChannel.HOTLINE,
    status: FaultStatus.MERGED,
    merged_into_id: 1,
    ticket_id: 1,
    created_at: "2026-09-26T08:12:00+08:00"
  },
  {
    id: 4,
    reporter_name: "孙小梅",
    phone: "13805310004",
    asset_id: 3,
    fault_type: FaultType.VOLTAGE_LOW,
    address_desc: "滨河公园北门管理房空调带不动",
    severity: Severity.NORMAL,
    report_channel: ReportChannel.APP,
    status: FaultStatus.PENDING,
    merged_into_id: null,
    ticket_id: null,
    created_at: "2026-09-26T09:20:00+08:00"
  },
  {
    id: 5,
    reporter_name: "工业园管委会",
    phone: "13805310005",
    asset_id: 5,
    fault_type: FaultType.EQUIPMENT_DAMAGE,
    address_desc: "北区 5 号分支箱箱门破损进水",
    severity: Severity.URGENT,
    report_channel: ReportChannel.GRID_PATROL,
    status: FaultStatus.PENDING,
    merged_into_id: null,
    ticket_id: null,
    created_at: "2026-09-26T09:40:00+08:00"
  },
  {
    id: 6,
    reporter_name: "周师傅",
    phone: "13805310006",
    asset_id: 4,
    fault_type: FaultType.SAFETY_RISK,
    address_desc: "滨河新村接户线弧垂过低，有货车刮蹭风险",
    severity: Severity.NORMAL,
    report_channel: ReportChannel.ONSITE,
    status: FaultStatus.PENDING,
    merged_into_id: null,
    ticket_id: null,
    created_at: "2026-09-26T10:05:00+08:00"
  }
];

export const repairTickets: RepairTicket[] = [
  {
    id: 1,
    fault_report_id: 1,
    merged_report_ids: [1, 2, 3],
    team_id: 1,
    dispatcher_id: 1,
    priority: Priority.URGENT,
    status: TicketStatus.REPAIRING,
    assigned_at: "2026-09-26T08:20:00+08:00",
    arrived_at: "2026-09-26T08:41:00+08:00",
    repairing_at: "2026-09-26T08:48:00+08:00",
    restored_at: null,
    closed_at: null,
    created_at: "2026-09-26T08:18:00+08:00",
    restore_remark: null
  },
  {
    id: 2,
    fault_report_id: 4,
    merged_report_ids: [4],
    team_id: null,
    dispatcher_id: 1,
    priority: Priority.MEDIUM,
    status: TicketStatus.WAIT_DISPATCH,
    assigned_at: null,
    arrived_at: null,
    repairing_at: null,
    restored_at: null,
    closed_at: null,
    created_at: "2026-09-26T09:25:00+08:00",
    restore_remark: null
  }
];

export const sparePartStocks: SparePartStock[] = [
  { part_code: "P-RW3-10F", part_name: "跌落式熔断器 RW3-10kV", warehouse_name: "中心仓库", stock: 12, safety_stock: 4, unit: "组" },
  { part_code: "P-RD-100A", part_name: "熔断器熔丝 100A", warehouse_name: "中心仓库", stock: 60, safety_stock: 20, unit: "根" },
  { part_code: "P-BYQ-S13", part_name: "配电变压器 S13-200kVA", warehouse_name: "中心仓库", stock: 2, safety_stock: 1, unit: "台" },
  { part_code: "P-JKLYJ-70", part_name: "架空绝缘导线 JKLYJ-70", warehouse_name: "中心仓库", stock: 800, safety_stock: 200, unit: "米" },
  { part_code: "P-FZX-10", part_name: "10kV 分支箱密封条", warehouse_name: "东郊仓", stock: 30, safety_stock: 10, unit: "套" },
  { part_code: "P-HWG-MS", part_name: "环网柜操作机构", warehouse_name: "中心仓库", stock: 3, safety_stock: 2, unit: "套" }
];

export const sparePartUsages: SparePartUsage[] = [
  {
    id: 1,
    ticket_id: 1,
    part_code: "P-RW3-10F",
    part_name: "跌落式熔断器 RW3-10kV",
    quantity: 1,
    warehouse_name: "中心仓库",
    requested_by: "周建国",
    approved_by: null,
    approved_at: null,
    reject_reason: null,
    usage_status: PartStatus.PENDING,
    created_at: "2026-09-26T08:55:00+08:00"
  },
  {
    id: 2,
    ticket_id: 1,
    part_code: "P-RD-100A",
    part_name: "熔断器熔丝 100A",
    quantity: 3,
    warehouse_name: "中心仓库",
    requested_by: "周建国",
    approved_by: "仓管员 钱敏",
    approved_at: "2026-09-26T09:02:00+08:00",
    reject_reason: null,
    usage_status: PartStatus.APPROVED,
    created_at: "2026-09-26T08:56:00+08:00"
  }
];

export const stockTxns: StockTxn[] = [
  {
    id: 1,
    part_code: "P-RD-100A",
    part_name: "熔断器熔丝 100A",
    warehouse_name: "中心仓库",
    change: -3,
    balance: 60,
    usage_id: 2,
    operator: "仓管员 钱敏",
    remark: "工单 #1 备件审批出库",
    created_at: "2026-09-26T09:02:00+08:00"
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: 1,
    actor: "调度员 郑凯",
    actor_role: "DISPATCHER",
    action: "登记故障报修 #1（刘桂芳，停电，危急）",
    target_type: "FaultReport",
    target_id: 1,
    created_at: "2026-09-26T08:05:00+08:00"
  },
  {
    id: 2,
    actor: "调度员 郑凯",
    actor_role: "DISPATCHER",
    action: "故障报修 #2 判定为同线路重复报修，并入主报修 #1",
    target_type: "FaultReport",
    target_id: 2,
    created_at: "2026-09-26T08:15:00+08:00"
  },
  {
    id: 3,
    actor: "调度员 郑凯",
    actor_role: "DISPATCHER",
    action: "故障报修 #1（含合并单 2 张）生成抢修工单 #1",
    target_type: "FaultReport",
    target_id: 1,
    created_at: "2026-09-26T08:18:00+08:00"
  },
  {
    id: 4,
    actor: "调度员 郑凯",
    actor_role: "DISPATCHER",
    action: "工单 #1 派工给班组 配电抢修一班（调度员 郑凯）",
    target_type: "RepairTicket",
    target_id: 1,
    created_at: "2026-09-26T08:20:00+08:00"
  },
  {
    id: 5,
    actor: "周建国",
    actor_role: "LEADER",
    action: "工单 #1 状态由 已派工 推进为 已到场（操作人 周建国）",
    target_type: "RepairTicket",
    target_id: 1,
    created_at: "2026-09-26T08:41:00+08:00"
  },
  {
    id: 6,
    actor: "周建国",
    actor_role: "LEADER",
    action: "工单 #1 状态由 已到场 推进为 处理中（操作人 周建国）",
    target_type: "RepairTicket",
    target_id: 1,
    created_at: "2026-09-26T08:48:00+08:00"
  },
  {
    id: 7,
    actor: "周建国",
    actor_role: "LEADER",
    action: "班组就工单 #1 申请备件 跌落式熔断器 RW3-10kV x1",
    target_type: "SparePart",
    target_id: 1,
    created_at: "2026-09-26T08:55:00+08:00"
  },
  {
    id: 8,
    actor: "仓管员 钱敏",
    actor_role: "WAREHOUSE",
    action: "仓管 钱敏 批准备件申请 #2，扣减库存 3 根",
    target_type: "SparePart",
    target_id: 2,
    created_at: "2026-09-26T09:02:00+08:00"
  }
];

/** 兼容旧引用名（App/旧 api 模块曾使用 mockData 聚合导出） */
export const mockData = {
  gridAsset: gridAssets,
  faultReport: faultReports,
  repairTicket: repairTickets,
  crew: crews,
  sparePartUsage: sparePartUsages,
  sparePartStock: sparePartStocks,
  stockTxn: stockTxns,
  auditLog: auditLogs
};
