-- grid-repair 配网抢修工单系统 · MySQL 8.0 初始化脚本
-- docker compose 首次启动 db 容器时自动执行；应用运行期使用同构内存种子数据。

CREATE TABLE IF NOT EXISTS grid_asset (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_code VARCHAR(64) NOT NULL,
  asset_type VARCHAR(64) NOT NULL,
  feeder_line VARCHAR(128) NOT NULL,
  voltage_level VARCHAR(16) NOT NULL DEFAULT '10kV',
  location_desc VARCHAR(255) NOT NULL,
  health_status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
  owner_team_id BIGINT NULL,
  last_fault_at DATETIME NULL,
  fault_count INT NOT NULL DEFAULT 0,
  INDEX idx_asset_line (feeder_line),
  INDEX idx_asset_health (health_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fault_report (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reporter_name VARCHAR(64) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  asset_id BIGINT NOT NULL,
  fault_type VARCHAR(32) NOT NULL,
  address_desc VARCHAR(255) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
  report_channel VARCHAR(32) NOT NULL DEFAULT 'HOTLINE',
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  merged_into_id BIGINT NULL,
  ticket_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fault_asset (asset_id),
  INDEX idx_fault_status (status),
  CONSTRAINT fk_fault_asset FOREIGN KEY (asset_id) REFERENCES grid_asset(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crew (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  leader_id BIGINT NOT NULL,
  leader_name VARCHAR(64) NOT NULL,
  skill_tags VARCHAR(255) NOT NULL,
  duty_status VARCHAR(16) NOT NULL DEFAULT 'ON_DUTY',
  current_ticket_id BIGINT NULL,
  contact_phone VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repair_ticket (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  fault_report_id BIGINT NOT NULL,
  merged_report_ids JSON NOT NULL,
  team_id BIGINT NULL,
  dispatcher_id BIGINT NOT NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(16) NOT NULL DEFAULT 'WAIT_DISPATCH',
  assigned_at DATETIME NULL,
  arrived_at DATETIME NULL,
  repairing_at DATETIME NULL,
  restored_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restore_remark VARCHAR(255) NULL,
  INDEX idx_ticket_status (status),
  CONSTRAINT fk_ticket_fault FOREIGN KEY (fault_report_id) REFERENCES fault_report(id),
  CONSTRAINT fk_ticket_team FOREIGN KEY (team_id) REFERENCES crew(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS spare_part_stock (
  part_code VARCHAR(64) PRIMARY KEY,
  part_name VARCHAR(128) NOT NULL,
  warehouse_name VARCHAR(64) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  safety_stock INT NOT NULL DEFAULT 0,
  unit VARCHAR(16) NOT NULL DEFAULT '件'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS spare_part_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  part_code VARCHAR(64) NOT NULL,
  part_name VARCHAR(128) NOT NULL,
  quantity INT NOT NULL,
  warehouse_name VARCHAR(64) NOT NULL,
  requested_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64) NULL,
  approved_at DATETIME NULL,
  reject_reason VARCHAR(255) NULL,
  usage_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usage_ticket (ticket_id),
  INDEX idx_usage_status (usage_status),
  CONSTRAINT fk_usage_ticket FOREIGN KEY (ticket_id) REFERENCES repair_ticket(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_txn (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  part_code VARCHAR(64) NOT NULL,
  part_name VARCHAR(128) NOT NULL,
  warehouse_name VARCHAR(64) NOT NULL,
  change_qty INT NOT NULL,
  balance INT NOT NULL,
  usage_id BIGINT NULL,
  operator VARCHAR(64) NOT NULL,
  remark VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_txn_part (part_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor VARCHAR(64) NOT NULL,
  actor_role VARCHAR(16) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_role (actor_role),
  INDEX idx_audit_target (target_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
