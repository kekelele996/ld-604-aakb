/**
 * 审计日志模板集中管理：每个核心实体 >= 4 条，所有写操作必须留痕。
 * 字段变更时必须同步本文件与对应 service / controller 调用处。
 */
export const LOG_TEMPLATES = {
  GridAsset: {
    create: "登记配网资产 {asset_code}（{feeder_line}，健康状态 {health_status}）",
    update: "更新配网资产 {asset_code} 基础信息：{changed}",
    healthChange: "配网资产 {asset_code} 健康状态 {from} → {to}（关联工单 {ticket_no}）",
    ownerChange: "配网资产 {asset_code} 归属班组调整为 {team_name}"
  },
  FaultReport: {
    create: "登记故障报修 {report_no}：{fault_type}，线路 {feeder_line}，分级 {severity}，影响 {affected_users} 户",
    merge: "报修单 {report_no} 判定为重复报修，合并至主单 {target_no}（同线路 {feeder_line}）",
    createTicket: "报修单 {report_no}（含 {merged_count} 张重复单）生成抢修工单 {ticket_no}",
    statusChange: "故障报修 {report_no} 状态变更为 {status}",
    restoreSync: "工单 {ticket_no} 复电联动：报修单 {report_no} 后端同步已复电"
  },
  RepairTicket: {
    create: "创建抢修工单 {ticket_no}，来源报修 {report_no}，优先级 {priority}",
    dispatch: "工单 {ticket_no} 派工至班组 {team_name}（技能匹配 {skill}）",
    advance: "工单 {ticket_no} 状态由 {from} 推进至 {to}（{stage_label}）",
    restore: "工单 {ticket_no} 后端确认复电，处理结论：{note}；用时 {duration}",
    close: "工单 {ticket_no} 归档结案",
    crewStatusSync: "派工联动班组 {team_name} 切换为出勤中，完工后恢复值班"
  },
  Crew: {
    create: "新建抢修班组 {name}，技能 {skills}",
    update: "更新抢修班组 {name} 信息：{changed}",
    dutyChange: "班组 {name} 值班状态 {from} → {to}",
    assignTicket: "班组 {name} 承接工单 {ticket_no}"
  },
  SparePartUsage: {
    apply: "班组为工单 {ticket_no} 提交备件申请 {req_no}：{part_name} × {quantity}",
    approve: "备件申请 {req_no} 后端审批通过，{part_name} × {quantity} 出库并扣减库存（余额 {balance}）",
    reject: "备件申请 {req_no} 后端审批驳回，原因：{reason}",
    returnPart: "备件申请 {req_no} 余料归还 {quantity} 件，库存回补至 {balance}",
    stockAdjust: "仓管盘点调整 {part_code} 库存 {from} → {to}"
  }
} as const;
export type LogTemplateEntity = keyof typeof LOG_TEMPLATES;

export function renderLogTemplate(
  entity: LogTemplateEntity,
  key: string,
  params: Record<string, string | number> = {}
): string {
  const template = (LOG_TEMPLATES as Record<string, Record<string, string>>)[entity]?.[key] ?? `${entity}.${key}`;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}
