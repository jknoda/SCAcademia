-- SCAcademia
-- Script consolidado para criacao de todas as tabelas do sistema
-- PostgreSQL 14+
-- Gerado em 2026-04-18

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE SCHEMA IF NOT EXISTS scacademia;
SET search_path TO scacademia, public;

-- =========================================================
-- 1. Multi-tenant e identidade
-- =========================================================

CREATE TABLE IF NOT EXISTS academies (
  academy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  fantasy_name TEXT,
  description TEXT,
  document_id VARCHAR(20),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  logo_url TEXT,
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100),
  address_postal_code VARCHAR(10),
  address_city VARCHAR(100),
  address_state CHAR(2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_users INTEGER NOT NULL DEFAULT 1000,
  storage_limit_gb INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_academies_document_id_unique ON academies(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_academies_document_id ON academies(document_id);
CREATE INDEX IF NOT EXISTS idx_academies_active ON academies(is_active) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE RESTRICT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  document_id VARCHAR(20),
  birth_date DATE,
  phone VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100),
  address_postal_code VARCHAR(10),
  address_city VARCHAR(100),
  address_state CHAR(2),
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_minor BOOLEAN NOT NULL DEFAULT FALSE,
  minor_consent_signed BOOLEAN NOT NULL DEFAULT FALSE,
  data_entrada DATE,
  data_saida DATE,
  last_login_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_users_academy_email UNIQUE (academy_id, email),
  CONSTRAINT chk_users_role CHECK (role IN ('Admin', 'Professor', 'Aluno', 'Responsavel'))
);

CREATE INDEX IF NOT EXISTS idx_users_academy ON users(academy_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(academy_id, role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(academy_id, is_active) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS roles (
  role_id SERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_roles_academy_name UNIQUE (academy_id, role_name)
);

CREATE TABLE IF NOT EXISTS permissions (
  permission_id SERIAL PRIMARY KEY,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(100),
  description TEXT,
  CONSTRAINT uq_permissions UNIQUE (resource, action, scope)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_permission_id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  token_type VARCHAR(50) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type ON auth_tokens(user_id, token_type);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

-- =========================================================
-- 2. Saude, perfil esportivo e LGPD
-- =========================================================

CREATE TABLE IF NOT EXISTS health_records (
  health_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  blood_type VARCHAR(5),
  weight_kg NUMERIC(5,2),
  height_cm INTEGER,
  hypertension BOOLEAN,
  diabetes BOOLEAN,
  cardiac BOOLEAN,
  labyrinthitis BOOLEAN,
  asthma_bronchitis BOOLEAN,
  epilepsy_seizures BOOLEAN,
  stress_depression BOOLEAN,
  health_screening_notes TEXT,
  allergies_encrypted BYTEA,
  medications_encrypted BYTEA,
  existing_conditions_encrypted BYTEA,
  emergency_contact_encrypted BYTEA,
  created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_records_user ON health_records(user_id, academy_id);

CREATE TABLE IF NOT EXISTS judo_profile (
  judo_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  is_federated BOOLEAN NOT NULL DEFAULT FALSE,
  federation_registration VARCHAR(100),
  federation_date DATE,
  current_belt VARCHAR(50),
  belt_date DATE,
  created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_judo_profile_student UNIQUE (student_id)
);

CREATE TABLE IF NOT EXISTS judo_belt_history (
  belt_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  belt VARCHAR(50) NOT NULL,
  received_date DATE NOT NULL,
  promoted_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judo_belt_history_student ON judo_belt_history(student_id, received_date DESC);

CREATE TABLE IF NOT EXISTS student_guardians (
  student_guardian_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  relationship VARCHAR(100),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_guardians UNIQUE (student_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian ON student_guardians(guardian_id);

CREATE TABLE IF NOT EXISTS consent_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  CONSTRAINT uq_consent_templates UNIQUE (academy_id, consent_type, version)
);

CREATE TABLE IF NOT EXISTS consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  consent_template_version INT NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  signature_image BYTEA,
  signed_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  guardian_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  CONSTRAINT chk_consents_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'withdrawn'))
);

CREATE INDEX IF NOT EXISTS idx_consents_user_type ON consents(user_id, consent_type);

CREATE TABLE IF NOT EXISTS deletion_requests (
  deletion_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  requested_by_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletion_scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by_id UUID REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status_scheduled
  ON deletion_requests(status, deletion_scheduled_at);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  report_data JSONB NOT NULL,
  file_path VARCHAR(500),
  signed_at TIMESTAMPTZ,
  signature_hash VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_academy_created
  ON compliance_reports(academy_id, created_at DESC);

-- =========================================================
-- 3. Treinos, turmas e tecnicas
-- =========================================================

CREATE TABLE IF NOT EXISTS turmas (
  turma_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_json JSONB,
  capacity INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_turmas_professor ON turmas(professor_id, is_active) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS turma_students (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(turma_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_at TIMESTAMPTZ,
  CONSTRAINT uq_turma_students UNIQUE (turma_id, student_id)
);

CREATE TABLE IF NOT EXISTS training_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(turma_id) ON DELETE RESTRICT,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  offline_synced_at TIMESTAMPTZ,
  client_created_at TIMESTAMPTZ,
  server_received_at TIMESTAMPTZ,
  last_write_wins_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_turma_date ON training_sessions(turma_id, session_date DESC);

CREATE TABLE IF NOT EXISTS session_attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  marked_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_session_attendance UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS techniques (
  technique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  icon_url VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_professor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_techniques_academy_category ON techniques(academy_id, category);
CREATE INDEX IF NOT EXISTS idx_techniques_display_order ON techniques(academy_id, display_order);

CREATE TABLE IF NOT EXISTS technique_presets (
  preset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  technique_ids TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_technique_presets UNIQUE (professor_id, academy_id, name)
);

CREATE TABLE IF NOT EXISTS session_techniques (
  session_technique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES techniques(technique_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  technique_order INT DEFAULT 0,
  is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_session_techniques UNIQUE (session_id, technique_id)
);

CREATE TABLE IF NOT EXISTS session_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sentiment VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_session_comments UNIQUE (session_id, student_id)
);

-- =========================================================
-- 4. Progresso, gamificacao e evolucao do atleta
-- =========================================================

CREATE TABLE IF NOT EXISTS student_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  total_sessions INT NOT NULL DEFAULT 0,
  total_attendance INT NOT NULL DEFAULT 0,
  total_attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  streak_current INT NOT NULL DEFAULT 0,
  streak_longest INT NOT NULL DEFAULT 0,
  badges_earned_count INT NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_progress UNIQUE (student_id, academy_id)
);

CREATE TABLE IF NOT EXISTS badges (
  badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(1024),
  criteria_type VARCHAR(100) NOT NULL,
  criteria_value INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_badges UNIQUE (academy_id, name)
);

CREATE TABLE IF NOT EXISTS student_badges (
  earned_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  CONSTRAINT uq_student_badges UNIQUE (badge_id, student_id)
);

CREATE TABLE IF NOT EXISTS athlete_progress_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  last_assessment_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_athlete_progress_profiles UNIQUE (athlete_id, academy_id)
);

CREATE TABLE IF NOT EXISTS athlete_progress_indicator_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  group_code VARCHAR(100) NOT NULL,
  group_name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_athlete_progress_indicator_group UNIQUE (academy_id, group_code)
);

CREATE TABLE IF NOT EXISTS athlete_progress_metric_definitions (
  metric_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  group_id UUID REFERENCES athlete_progress_indicator_groups(group_id) ON DELETE SET NULL,
  group_code VARCHAR(100),
  metric_code VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_category VARCHAR(50) NOT NULL,
  description TEXT,
  input_instruction TEXT,
  unit VARCHAR(30) NOT NULL DEFAULT 'score',
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  value_type VARCHAR(30) NOT NULL DEFAULT 'score',
  display_format VARCHAR(50) NOT NULL DEFAULT 'score',
  allow_period_aggregation BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_athlete_progress_metric_code UNIQUE (academy_id, metric_code),
  CONSTRAINT chk_athlete_progress_metric_category CHECK (
    metric_category IN ('technical', 'physical', 'tactical', 'competition', 'psychological', 'training')
  )
);

CREATE TABLE IF NOT EXISTS athlete_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  recorded_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_athlete_assessments_athlete_date
  ON athlete_assessments(academy_id, athlete_id, assessment_date DESC);

CREATE TABLE IF NOT EXISTS athlete_metric_values (
  metric_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES athlete_assessments(assessment_id) ON DELETE CASCADE,
  metric_definition_id UUID REFERENCES athlete_progress_metric_definitions(metric_definition_id) ON DELETE SET NULL,
  athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  metric_code VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50) NOT NULL,
  metric_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  secondary_value NUMERIC(10,2),
  metric_display_value TEXT,
  structured_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_unit VARCHAR(30) NOT NULL DEFAULT 'score',
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_athlete_metric_values_lookup
  ON athlete_metric_values(academy_id, athlete_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS athlete_progress_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES athlete_assessments(assessment_id) ON DELETE SET NULL,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS athlete_progress_alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  alert_type VARCHAR(80) NOT NULL,
  alert_kind VARCHAR(20) NOT NULL DEFAULT 'alert',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_athlete_progress_alerts_lookup
  ON athlete_progress_alerts(academy_id, athlete_id, is_active, updated_at DESC);

-- =========================================================
-- 5. Auditoria, sincronizacao, monitoramento e backup
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  changes_json JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_academy_timestamp ON audit_logs(academy_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  batch_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id UUID,
  payload JSONB NOT NULL,
  client_timestamp BIGINT NOT NULL,
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 5,
  error_message TEXT,
  next_retry TIMESTAMPTZ,
  resolved_with VARCHAR(20),
  conflict_detected BOOLEAN NOT NULL DEFAULT FALSE,
  server_version JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_sync_queue_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')),
  CONSTRAINT chk_sync_queue_status CHECK (status IN ('pending', 'synced', 'failed', 'retry'))
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_professor ON sync_queue(professor_id, academy_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sync_queue_batch ON sync_queue(batch_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  batch_id UUID NOT NULL,
  sync_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_records INT NOT NULL,
  synced_count INT NOT NULL,
  failed_count INT NOT NULL,
  conflict_count INT NOT NULL,
  duration_ms INT,
  error_summary TEXT,
  client_version VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_sync_history_counts CHECK (
    synced_count >= 0 AND failed_count >= 0 AND conflict_count >= 0
  )
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  channels INT NOT NULL DEFAULT 7,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  CONSTRAINT chk_notifications_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);

CREATE TABLE IF NOT EXISTS system_health (
  health_id BIGSERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  component VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  cpu_percent NUMERIC(5,2),
  memory_percent NUMERIC(5,2),
  disk_percent NUMERIC(5,2),
  response_time_ms INT,
  error_count INT NOT NULL DEFAULT 0,
  details_json JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_system_health_component CHECK (component IN ('api', 'database', 'cache', 'email', 'storage')),
  CONSTRAINT chk_system_health_status CHECK (status IN ('ok', 'warning', 'degraded', 'offline'))
);

CREATE INDEX IF NOT EXISTS idx_system_health_academy_component ON system_health(academy_id, component, timestamp DESC);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  severity VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  acknowledged_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_academy_status ON alerts(academy_id, status);

CREATE TABLE IF NOT EXISTS backup_jobs (
  backup_job_id UUID PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  file_name TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,
  include_history BOOLEAN NOT NULL DEFAULT FALSE,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  initiated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  download_expires_at TIMESTAMPTZ,
  retention_days INT NOT NULL DEFAULT 30,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_backup_jobs_type CHECK (type IN ('auto', 'manual')),
  CONSTRAINT chk_backup_jobs_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_academy_created_at ON backup_jobs(academy_id, created_at DESC);

-- fim do script
