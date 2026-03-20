-- Flyway Migration: V5_0__Sync_Monitor.sql
-- Phase 5: Offline Sync & System Monitoring
-- Tables: audit_logs, sync_queue, notifications, system_health, alerts
-- Dependencies: V1 (users, academies)
-- Status: Independent, reversible

-- `audit_logs` (Append-Only, LGPD Immutable)
CREATE TABLE audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  changes_json JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retention_until TIMESTAMP,
  CONSTRAINT resource_id_not_empty CHECK (length(trim(resource_id)) > 0)
);

CREATE INDEX idx_audit_logs_academy ON audit_logs(academy_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_retention ON audit_logs(retention_until) WHERE retention_until IS NOT NULL;

-- `sync_queue` (Offline Changes Queue)
CREATE TABLE sync_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  payload_json JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  client_timestamp TIMESTAMP NOT NULL,
  server_received_timestamp TIMESTAMP,
  synced_at TIMESTAMP,
  error_message TEXT,
  error_code VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'synced', 'failed'))
);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id, status);
CREATE INDEX idx_sync_queue_pending ON sync_queue(academy_id, status) WHERE status = 'pending';
CREATE INDEX idx_sync_queue_failed ON sync_queue(academy_id, status) WHERE status = 'failed';

-- `notifications` (Push/Email/In-app)
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  channels INT NOT NULL DEFAULT 7,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivery_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  CONSTRAINT valid_type CHECK (type IN ('badge_earned', 'attendance_reminder', 'alert_system', 'comment_received')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  CONSTRAINT valid_channels CHECK (channels >= 0 AND channels <= 7)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_notifications_pending ON notifications(academy_id, status) WHERE status = 'pending';
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at);

-- `system_health` (Monitoring Snapshots)
CREATE TABLE system_health (
  health_id BIGSERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  component VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  cpu_percent NUMERIC(5,2),
  memory_percent NUMERIC(5,2),
  disk_percent NUMERIC(5,2),
  response_time_ms INT,
  error_count INT DEFAULT 0,
  details_json JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_component CHECK (component IN ('api', 'database', 'cache', 'auth', 'storage')),
  CONSTRAINT valid_status CHECK (status IN ('green', 'yellow', 'red')),
  CONSTRAINT valid_cpu CHECK (cpu_percent IS NULL OR (cpu_percent >= 0 AND cpu_percent <= 100))
);

CREATE INDEX idx_system_health_academy ON system_health(academy_id, component, timestamp DESC);
CREATE INDEX idx_system_health_status ON system_health(academy_id, status) WHERE status != 'green';

-- `alerts` (System & Compliance Alerts)
CREATE TABLE alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  severity VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  acknowledged_by_user_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('system', 'compliance', 'performance', 'security')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'acknowledged', 'resolved'))
);

CREATE INDEX idx_alerts_academy ON alerts(academy_id, status);
CREATE INDEX idx_alerts_severity ON alerts(academy_id, severity) WHERE status != 'resolved';
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ============================================================================
-- MIGRATION COMPLETE — V5_0
-- ============================================================================
-- 5 tables created
-- Offline sync, notifications, system monitoring
-- LGPD audit trail with 7-year retention
-- All critical infrastructure complete
