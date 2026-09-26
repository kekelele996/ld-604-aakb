-- =====================================================================
-- 电力配网抢修工单系统 grid-repair · MySQL 8.0 初始化脚本
-- 容器首次启动时自动执行；默认 STORAGE=memory 时后端使用本地种子内存库，
-- 本脚本用于 STORAGE=mysql 模式的表结构参照与后续 Prisma 接入。
-- =====================================================================
CREATE DATABASE IF NOT EXISTS `grid_repair` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `grid_repair`;

-- 配网资产
CREATE TABLE IF NOT EXISTS grid_asset (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_code      VARCHAR(64)  NOT NULL UNIQUE COMMENT '资产编号',
  asset_type      VARCHAR(32)  NOT NULL COMMENT 'LINE/TRANSFORMER/SWITCH/METER 或故障枚举',
  feeder_line     VARCHAR(128) NOT NULL COMMENT '馈线名称',
  voltage_level   VARCHAR(16)  NOT NULL COMMENT '0.4kV/10kV/35kV',
  location_desc   VARCHAR(255) NOT NULL,
  health_status   ENUM('NORMAL','WATCH','DEGRADED','DANGEROUS') NOT NULL DEFAULT 'NORMAL',
  owner_team_id   BIGINT NULL,
  last_fault_at   DATETIME NULL,
  INDEX idx_asset_line (feeder_line),
  INDEX idx_asset_health (health_status)
) ENGINE=InnoDB COMMENT='配网资产台账';

-- 抢修班组
CREATE TABLE IF NOT EXISTS crew (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  name              VARCHAR(64) NOT NULL,
  leader_id         BIGINT NOT NULL,
  leader_name       VARCHAR(32) NOT NULL,
  skill_tags        JSON NOT NULL COMMENT '技能标签数组 OUTAGE/CABLE/TRANSFORMER/SWITCH/METER/LIVE',
  duty_status       ENUM('ON_DUTY','ON_SITE','OFF_DUTY') NOT NULL DEFAULT 'ON_DUTY',
  current_ticket_id BIGINT NULL,
  contact_phone     VARCHAR(20) NOT NULL
) ENGINE=InnoDB COMMENT='抢修班组';

-- 故障报修
CREATE TABLE IF NOT EXISTS fault_report (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  report_no      VARCHAR(32) NOT NULL UNIQUE,
  reporter_name  VARCHAR(64) NOT NULL,
  phone          VARCHAR(20) NOT NULL DEFAULT '',
  asset_id       BIGINT NOT NULL,
  fault_type     ENUM('OUTAGE','VOLTAGE_LOW','TRIP','EQUIPMENT_DAMAGE','SAFETY_RISK') NOT NULL,
  address_desc   VARCHAR(255) NOT NULL,
  severity       ENUM('NORMAL','URGENT','CRITICAL') NOT NULL,
  report_channel ENUM('HOTLINE','APP','PATROL','ONSITE') NOT NULL DEFAULT 'HOTLINE',
  status         ENUM('PENDING','TICKETED','MERGED','RESTORED','CLOSED') NOT NULL DEFAULT 'PENDING',
  affected_users INT NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL,
  merged_into_id BIGINT NULL COMMENT '合并指向的主报修单',
  ticket_id      BIGINT NULL,
  INDEX idx_fault_asset (asset_id),
  INDEX idx_fault_status (status),
  CONSTRAINT fk_fault_asset FOREIGN KEY (asset_id) REFERENCES grid_asset(id)
) ENGINE=InnoDB COMMENT='故障报修单（同线路重复可合并）';

-- 抢修工单
CREATE TABLE IF NOT EXISTS repair_ticket (
  id               BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_no        VARCHAR(32) NOT NULL UNIQUE,
  fault_report_id  BIGINT NOT NULL COMMENT '主报修单',
  merged_report_ids JSON NOT NULL COMMENT '合并的重复报修单 id 数组',
  team_id          BIGINT NULL,
  dispatcher_id    BIGINT NOT NULL,
  priority         ENUM('NORMAL','URGENT','CRITICAL') NOT NULL,
  status           ENUM('WAIT_DISPATCH','ASSIGNED','ARRIVED','REPAIRING','RESTORED','CLOSED') NOT NULL DEFAULT 'WAIT_DISPATCH',
  assigned_at      DATETIME NULL,
  arrived_at       DATETIME NULL,
  repairing_at     DATETIME NULL,
  restored_at      DATETIME NULL,
  closed_at        DATETIME NULL,
  restore_note     VARCHAR(500) NULL,
  created_at       DATETIME NOT NULL,
  INDEX idx_ticket_status (status),
  CONSTRAINT fk_ticket_report FOREIGN KEY (fault_report_id) REFERENCES fault_report(id),
  CONSTRAINT fk_ticket_team FOREIGN KEY (team_id) REFERENCES crew(id)
) ENGINE=InnoDB COMMENT='抢修工单';

-- 备件库存台账
CREATE TABLE IF NOT EXISTS spare_part (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  part_code      VARCHAR(64) NOT NULL UNIQUE,
  part_name      VARCHAR(128) NOT NULL,
  spec           VARCHAR(128) NOT NULL DEFAULT '',
  warehouse_name VARCHAR(64) NOT NULL,
  stock          INT NOT NULL DEFAULT 0,
  safety_stock   INT NOT NULL DEFAULT 0,
  unit           VARCHAR(16) NOT NULL DEFAULT '件'
) ENGINE=InnoDB COMMENT='备件库存台账';

-- 备件领用申请（审批通过才扣库存）
CREATE TABLE IF NOT EXISTS spare_part_usage (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  req_no         VARCHAR(32) NOT NULL UNIQUE,
  ticket_id      BIGINT NOT NULL,
  part_id        BIGINT NOT NULL,
  part_code      VARCHAR(64) NOT NULL,
  part_name      VARCHAR(128) NOT NULL,
  quantity       INT NOT NULL,
  warehouse_name VARCHAR(64) NOT NULL,
  applicant      VARCHAR(64) NOT NULL,
  approved_by    VARCHAR(64) NULL,
  approved_at    DATETIME NULL,
  usage_status   ENUM('PENDING','APPROVED','REJECTED','RETURNED') NOT NULL DEFAULT 'PENDING',
  reject_reason  VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL,
  INDEX idx_usage_ticket (ticket_id),
  INDEX idx_usage_status (usage_status),
  CONSTRAINT fk_usage_part FOREIGN KEY (part_id) REFERENCES spare_part(id)
) ENGINE=InnoDB COMMENT='备件领用申请';

-- 备件库存流水
CREATE TABLE IF NOT EXISTS stock_ledger (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  part_id    BIGINT NOT NULL,
  part_code  VARCHAR(64) NOT NULL,
  change_qty INT NOT NULL COMMENT '负=出库扣减，正=回补/调整',
  balance    INT NOT NULL,
  reason     VARCHAR(128) NOT NULL,
  ref_req_no VARCHAR(32) NULL,
  operator   VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_ledger_part (part_id),
  CONSTRAINT fk_ledger_part FOREIGN KEY (part_id) REFERENCES spare_part(id)
) ENGINE=InnoDB COMMENT='备件库存流水（审批扣减/归还回补/盘点调整）';

-- 操作审计日志（所有写操作留痕）
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor       VARCHAR(64) NOT NULL,
  actor_role  ENUM('DISPATCHER','LEADER','WAREHOUSE','AUDITOR') NOT NULL,
  action      VARCHAR(64) NOT NULL COMMENT '动作码，如 ticket.dispatch',
  target_type ENUM('FaultReport','RepairTicket','Crew','SparePartUsage','SparePart','GridAsset','System') NOT NULL,
  target_id   VARCHAR(64) NOT NULL,
  detail      VARCHAR(500) NOT NULL,
  created_at  DATETIME NOT NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_time (created_at)
) ENGINE=InnoDB COMMENT='操作审计日志';

-- 登录账户（本地演示，密码均为 123456，实际校验由后端/JWT 完成）
CREATE TABLE IF NOT EXISTS app_user (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(32) NOT NULL UNIQUE,
  name          VARCHAR(64) NOT NULL,
  role          ENUM('DISPATCHER','LEADER','WAREHOUSE','AUDITOR') NOT NULL,
  password_hash VARCHAR(128) NOT NULL DEFAULT ''
) ENGINE=InnoDB COMMENT='系统用户（RBAC 四角色）';

INSERT INTO app_user (username, name, role) VALUES
  ('dispatcher', '调度员-林调度', 'DISPATCHER'),
  ('leader',     '张建国（班组长）', 'LEADER'),
  ('warehouse',  '仓管员-周敏', 'WAREHOUSE'),
  ('auditor',    '审计员-郑审计', 'AUDITOR')
ON DUPLICATE KEY UPDATE name = VALUES(name);
