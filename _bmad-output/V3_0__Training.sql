-- Flyway Migration: V3_0__Training.sql
-- Phase 3: Training Sessions & Technique Management
-- Tables: turmas, turma_students, training_sessions, session_attendance, techniques, session_techniques, session_comments
-- Dependencies: V1 (users, academies)
-- Status: Independent, reversible

-- `turmas` (Classes/Groups)
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
  CONSTRAINT unique_enrollment UNIQUE (turma_id, student_id),
  CONSTRAINT student_is_aluno CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = turma_students.student_id AND role = 'Aluno')
  )
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

-- `session_attendance` (Frequency Tracking)
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

-- `techniques` (Technique Library)
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

-- `session_techniques` (Which Techniques Used in Session)
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

-- `session_comments` (Per-Student Notes)
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
-- MIGRATION COMPLETE — V3_0
-- ============================================================================
-- 7 tables created
-- Training infrastructure with sessions, attendance, techniques, and comments
-- Offline sync support ready
