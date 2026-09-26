/**
 * 日志模板集中存放 —— 任何写操作都必须通过 renderLog 生成审计记录。
 * 字段变更时：改这里 + 对应 store action + 后端 logTemplates（前后端镜像）。
 * 每个实体不少于 4 条模板。
 */
export const LogAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  STATUS_CHANGE: "STATUS_CHANGE",
  MERGE: "MERGE",
  GENERATE: "GENERATE",
  DISPATCH: "DISPATCH",
  ASSIGN: "ASSIGN",
  RESTORE: "RESTORE",
  CLOSE: "CLOSE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  CONSUME: "CONSUME",
  RETURN: "RETURN",
  STOCK_OUT: "STOCK_OUT",
  STOCK_IN: "STOCK_IN"
} as const;

type LogParams = Record<string, string | number>;

export const LOG_TEMPLATES: Record<string, Record<string, string>> = {
  GridAsset: {
    CREATE: "登记配网资产 {assetCode}（{feederLine}，{assetType}）",
    UPDATE: "更新配网资产 {assetCode} 台账信息",
    STATUS_CHANGE: "配网资产 {assetCode} 健康状态由 {from} 变更为 {to}",
    LINE_BIND: "配网资产 {assetCode} 线路归属调整为 {feederLine}"
  },
  FaultReport: {
    CREATE: "登记故障报修 #{id}（{reporterName}，{faultType}，{severity}）",
    UPDATE: "更新故障报修 #{id} 的分级与描述",
    STATUS_CHANGE: "故障报修 #{id} 状态由 {from} 变更为 {to}",
    MERGE: "故障报修 #{id} 判定为同线路重复报修，并入主报修 #{masterId}",
    GENERATE: "故障报修 #{id}（含合并单 {mergedCount} 张）生成抢修工单 #{ticketId}"
  },
  RepairTicket: {
    CREATE: "生成抢修工单 #{id}，优先级 {priority}，来源报修 {faultReportId}",
    DISPATCH: "工单 #{id} 派工给班组 {teamName}（调度员 {dispatcher}）",
    STATUS_CHANGE: "工单 #{id} 状态由 {from} 推进为 {to}（操作人 {operator}）",
    RESTORE: "工单 #{id} 确认复电，同步恢复资产 {assetCode} 并关闭关联报修",
    CLOSE: "工单 #{id} 复电归档，抢修用时 {duration}"
  },
  Crew: {
    CREATE: "建立抢修班组 {name}（技能：{skillTags}）",
    UPDATE: "更新班组 {name} 联系方式与成员",
    STATUS_CHANGE: "班组 {name} 值班状态切换为 {dutyStatus}",
    ASSIGN: "班组 {name} 承接工单 #{ticketId}"
  },
  SparePart: {
    CREATE: "班组就工单 #{ticketId} 申请备件 {partName} x{quantity}",
    APPROVE: "仓管 {approver} 批准备件申请 #{id}，扣减库存 {quantity} 件",
    REJECT: "仓管 {approver} 驳回备件申请 #{id}：{reason}",
    CONSUME: "工单 #{ticketId} 消耗备件 {partName} x{quantity}",
    RETURN: "工单 #{ticketId} 归还备件 {partName} x{quantity}，库存回补",
    STOCK_ADJUST: "备件 {partCode} 盘点调整：{from} → {to}"
  }
};

export const renderLog = (entity: keyof typeof LOG_TEMPLATES, action: string, params: LogParams = {}): string => {
  const template = LOG_TEMPLATES[entity]?.[action] ?? `${String(entity)}.${action}`;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? "-"));
};
