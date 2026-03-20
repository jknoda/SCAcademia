-- Flyway Migration: V4_0__Progress_Judo.sql
-- Phase 4: Student Progress Tracking & Gamification
-- Tables: student_progress, badges, student_badges
-- Dependencies: V1 (academies, users), V2 (judo_profile, judo_belt_history)
-- Status: Independent, reversible

-- `student_progress` (Aggregated Performance Metrics)
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

-- `badges` (Badge Library)
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

-- `student_badges` (Earned Badges)
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
-- MIGRATION COMPLETE — V4_0
-- ============================================================================
-- 3 tables created
-- Student progress tracking and badge gamification
-- Ready for engagement features
