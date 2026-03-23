-- SCAcademia — Database Schema (Complete DDL)
-- Created: 2026-03-20
-- PostgreSQL 14+
-- Language: PT-BR
-- Multi-tenant with LGPD compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. CORE IDENTITY & MULTI-TENANCY
-- ============================================================================

-- `academies` (Tenant Root)
CREATE TABLE academies (
  academy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_id VARCHAR(20) UNIQUE NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100),
  address_postal_code VARCHAR(10),
  address_city VARCHAR(100),
  address_state CHAR(2),
  is_active BOOLEAN DEFAULT true,
  max_users INTEGER DEFAULT 1000,
  storage_limit_gb INTEGER DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT academy_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT academy_email_format CHECK (contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_academies_document ON academies(document_id);
CREATE INDEX idx_academies_deleted_at ON academies(deleted_at) WHERE deleted_at IS NULL;

-- `users` (All User Types)
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE RESTRICT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
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
  is_active BOOLEAN DEFAULT true,
  is_minor BOOLEAN DEFAULT false,
  minor_consent_signed BOOLEAN DEFAULT false,
  data_entrada DATE,
  data_saida DATE,
  last_login_at TIMESTAMP,
  password_changed_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_email_per_academy UNIQUE (academy_id, email),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT birth_date_valid CHECK (birth_date <= CURRENT_DATE),
  CONSTRAINT valid_role CHECK (role IN ('Admin', 'Professor', 'Aluno', 'Responsavel'))
);

CREATE INDEX idx_users_academy_id ON users(academy_id);
CREATE INDEX idx_users_academy_email ON users(academy_id, email);
CREATE INDEX idx_users_role ON users(academy_id, role);
CREATE INDEX idx_users_is_active ON users(academy_id, is_active) WHERE is_active = true;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- `roles` (RBAC)
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_per_academy UNIQUE (academy_id, role_name)
);

CREATE INDEX idx_roles_academy ON roles(academy_id);

-- `permissions` (RBAC)
CREATE TABLE permissions (
  permission_id SERIAL PRIMARY KEY,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(100),
  description TEXT,
  CONSTRAINT unique_permission UNIQUE (resource, action, scope)
);

-- `role_permissions` (RBAC Assignment)
CREATE TABLE role_permissions (
  role_permission_id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- `auth_tokens` (JWT Tracking)
CREATE TABLE auth_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  token_type VARCHAR(50) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  CONSTRAINT token_expiry CHECK (expires_at > issued_at)
);

CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id, token_type);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- 2. HEALTH & LGPD COMPLIANCE
-- ============================================================================

-- `health_records` (Encrypted)
CREATE TABLE health_records (
  health_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  blood_type VARCHAR(5),
  weight_kg NUMERIC(5,2),
  height_cm INT,
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
  created_by_user_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- NOTE: role='Aluno' enforced at application level (PostgreSQL does not support subqueries in CHECK)
  CONSTRAINT valid_blood_type CHECK (blood_type IS NULL OR blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'))
);

CREATE INDEX idx_health_records_user ON health_records(user_id);
CREATE INDEX idx_health_records_academy ON health_records(academy_id);

-- `judo_profile` (1:1 com alunos)
CREATE TABLE judo_profile (
  judo_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  is_federated BOOLEAN DEFAULT false,
  federation_registration VARCHAR(100),
  federation_date DATE,
  current_belt VARCHAR(50),
  belt_date DATE,
  created_by_user_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- NOTE: role='Aluno' enforced at application level (PostgreSQL does not support subqueries in CHECK)
  CONSTRAINT unique_student_judo UNIQUE (student_id)
);

CREATE INDEX idx_judo_profile_student ON judo_profile(student_id);
CREATE INDEX idx_judo_profile_academy ON judo_profile(academy_id);
CREATE INDEX idx_judo_profile_belt ON judo_profile(academy_id, current_belt);
CREATE INDEX idx_judo_profile_federated ON judo_profile(academy_id, is_federated) WHERE is_federated = true;

-- `judo_belt_history` (Auditoria completa)
CREATE TABLE judo_belt_history (
  belt_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  belt VARCHAR(50) NOT NULL,
  received_date DATE NOT NULL,
  promoted_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- NOTE: role='Aluno' enforced at application level (PostgreSQL does not support subqueries in CHECK)
);

CREATE INDEX idx_judo_belt_history_student ON judo_belt_history(student_id, received_date DESC);
CREATE INDEX idx_judo_belt_history_academy ON judo_belt_history(academy_id, received_date DESC);
CREATE INDEX idx_judo_belt_history_promoted_by ON judo_belt_history(promoted_by_user_id);
CREATE INDEX idx_judo_belt_history_received_date ON judo_belt_history(academy_id, received_date);

-- `student_guardians` (Linking Students to Guardians)
CREATE TABLE student_guardians (
  student_guardian_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  relationship VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (student_id != guardian_id),
  -- NOTE: role checks enforced at application level (PostgreSQL does not support subqueries in CHECK)
  CONSTRAINT unique_guardian_relation UNIQUE (student_id, guardian_id)
);

CREATE INDEX idx_student_guardians_student ON student_guardians(student_id);
CREATE INDEX idx_student_guardians_guardian ON student_guardians(guardian_id);
CREATE INDEX idx_student_guardians_academy ON student_guardians(academy_id);
CREATE INDEX idx_student_guardians_primary ON student_guardians(academy_id, is_primary) WHERE is_primary = true;
CREATE UNIQUE INDEX idx_student_guardians_unique_primary ON student_guardians(student_id) WHERE is_primary = true;

-- `consents` (LGPD Digital Signature)
CREATE TABLE consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  consent_template_version INT NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  signature_image BYTEA,
  signed_by_user_id UUID REFERENCES users(user_id),
  guardian_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP,
  expires_at TIMESTAMP,
  CONSTRAINT valid_consent_type CHECK (consent_type IN ('health', 'ethics', 'privacy')),
  CONSTRAINT valid_consent_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'withdrawn'))
);

CREATE INDEX idx_consents_user ON consents(user_id, consent_type);
CREATE INDEX idx_consents_academy ON consents(academy_id);
CREATE INDEX idx_consents_status ON consents(academy_id, status);
CREATE INDEX idx_consents_guardian ON consents(guardian_id) WHERE guardian_id IS NOT NULL;
CREATE INDEX idx_consents_expires ON consents(expires_at) WHERE status IN ('accepted', 'pending');

-- `consent_templates` (Version History)
CREATE TABLE consent_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  version INT NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_at TIMESTAMP,
  expires_at TIMESTAMP,
  CONSTRAINT unique_template_version UNIQUE (academy_id, consent_type, version),
  CONSTRAINT version_positive CHECK (version > 0)
);

CREATE INDEX idx_consent_templates_academy_active ON consent_templates(academy_id, is_active);

-- ============================================================================
-- 3. TRAINING & PROGRESS
-- ============================================================================

-- `turmas` (Classes / Groups)
CREATE TABLE turmas (
  turma_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_json JSONB,
  capacity INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_turma_per_professor UNIQUE (professor_id, name, deleted_at),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_turmas_academy ON turmas(academy_id);
CREATE INDEX idx_turmas_professor ON turmas(professor_id, is_active);
CREATE INDEX idx_turmas_deleted_at ON turmas(deleted_at) WHERE deleted_at IS NULL;

-- `turma_students` (Enrollment)
CREATE TABLE turma_students (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(turma_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  status VARCHAR(50) NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dropped_at TIMESTAMP,
  CONSTRAINT unique_enrollment UNIQUE (turma_id, student_id)
  -- NOTE: role='Aluno' enforced at application level (PostgreSQL does not support subqueries in CHECK)
);

CREATE INDEX idx_turma_students_turma ON turma_students(turma_id, status);
CREATE INDEX idx_turma_students_student ON turma_students(student_id, status);

-- `training_sessions` (Workouts)
CREATE TABLE training_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(turma_id) ON DELETE RESTRICT,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  notes TEXT,
  offline_synced_at TIMESTAMP,
  client_created_at TIMESTAMP,
  server_received_at TIMESTAMP,
  last_write_wins_timestamp TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT duration_positive CHECK (duration_minutes > 0)
);

CREATE INDEX idx_training_sessions_turma ON training_sessions(turma_id, session_date);
CREATE INDEX idx_training_sessions_professor ON training_sessions(professor_id, session_date);
CREATE INDEX idx_training_sessions_academy ON training_sessions(academy_id, session_date);
CREATE INDEX idx_training_sessions_synced ON training_sessions(academy_id, offline_synced_at) WHERE offline_synced_at IS NULL;

-- `session_attendance` (Frequency)
CREATE TABLE session_attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  status VARCHAR(50) NOT NULL,
  marked_by_user_id UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_attendance_per_session UNIQUE (session_id, student_id),
  CONSTRAINT valid_status CHECK (status IN ('present', 'absent', 'justified'))
);

CREATE INDEX idx_session_attendance_student ON session_attendance(student_id, academy_id);
CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);

-- `techniques` (Library)
CREATE TABLE techniques (
  technique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_technique_per_academy UNIQUE (academy_id, name, deleted_at),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_techniques_academy ON techniques(academy_id, is_favorite);
CREATE INDEX idx_techniques_category ON techniques(academy_id, category);

-- `session_techniques` (Which techniques used in session)
CREATE TABLE session_techniques (
  session_technique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES techniques(technique_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  technique_order INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_technique_per_session UNIQUE (session_id, technique_id),
  CONSTRAINT order_positive CHECK (technique_order > 0)
);

CREATE INDEX idx_session_techniques_session ON session_techniques(session_id, technique_order);

-- `session_comments` (Per-student notes)
CREATE TABLE session_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  content TEXT NOT NULL,
  sentiment VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_comment_per_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX idx_session_comments_student ON session_comments(student_id, academy_id);
CREATE INDEX idx_session_comments_session ON session_comments(session_id);

-- ============================================================================
-- 4. PROGRESS TRACKING & GAMIFICATION
-- ============================================================================

-- `student_progress` (Aggregated Metrics)
CREATE TABLE student_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  total_sessions INT DEFAULT 0,
  total_attendance INT DEFAULT 0,
  total_attendance_percentage NUMERIC(5,2) DEFAULT 0,
  streak_current INT DEFAULT 0,
  streak_longest INT DEFAULT 0,
  badges_earned_count INT DEFAULT 0,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE UNIQUE INDEX idx_student_progress_student_academy ON student_progress(student_id, academy_id);

-- `badges` (Library)
CREATE TABLE badges (
  badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(1024),
  criteria_type VARCHAR(100) NOT NULL,
  criteria_value INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_badge_per_academy UNIQUE (academy_id, name),
  CONSTRAINT valid_criteria CHECK (criteria_type IN ('streak', 'attendance_percentage', 'sessions_total', 'milestone'))
);

CREATE INDEX idx_badges_academy ON badges(academy_id);

-- `student_badges` (Earned)
CREATE TABLE student_badges (
  earned_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notified_at TIMESTAMP,
  CONSTRAINT unique_badge_per_student UNIQUE (badge_id, student_id)
);

CREATE INDEX idx_student_badges_student ON student_badges(student_id, academy_id);
CREATE INDEX idx_student_badges_earned_at ON student_badges(earned_at);

-- ============================================================================
-- 5. AUDIT LOGGING & LGPD (IMMUTABLE)
-- ============================================================================

-- `audit_logs` (Append-Only)
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

-- ============================================================================
-- 6. OFFLINE SYNC & NOTIFICATIONS
-- ============================================================================

-- `sync_queue` (Offline Changes)
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

-- ============================================================================
-- 7. ADMIN & SYSTEM MONITORING
-- ============================================================================

-- `system_health` (Snapshots)
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

-- `alerts` (System & Compliance)
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
-- MIGRATIONS COMPLETE
-- ============================================================================
-- Schema version: 1.0
-- Generated: 2026-03-20
-- All tables created with indexes and constraints
-- Ready for development
