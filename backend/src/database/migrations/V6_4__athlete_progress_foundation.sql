-- Migration: V6_4__athlete_progress_foundation.sql
-- Story 10.1: Base de modelagem para evolução do atleta

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

CREATE INDEX IF NOT EXISTS idx_athlete_progress_profiles_academy
  ON athlete_progress_profiles(academy_id, athlete_id);

CREATE TABLE IF NOT EXISTS athlete_progress_metric_definitions (
  metric_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  metric_code VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_category VARCHAR(50) NOT NULL,
  unit VARCHAR(30) NOT NULL DEFAULT 'score',
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_athlete_progress_metric_code UNIQUE (academy_id, metric_code),
  CONSTRAINT chk_athlete_progress_metric_category CHECK (
    metric_category IN ('technical', 'physical', 'tactical', 'competition', 'psychological', 'training')
  )
);

CREATE INDEX IF NOT EXISTS idx_athlete_progress_metric_definitions_academy
  ON athlete_progress_metric_definitions(academy_id, metric_category);

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
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_athlete_assessment_source CHECK (source IN ('manual', 'system'))
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
  metric_value NUMERIC(10,2) NOT NULL,
  metric_unit VARCHAR(30) NOT NULL DEFAULT 'score',
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_athlete_metric_value_category CHECK (
    metric_category IN ('technical', 'physical', 'tactical', 'competition', 'psychological', 'training')
  )
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

CREATE INDEX IF NOT EXISTS idx_athlete_progress_snapshots_lookup
  ON athlete_progress_snapshots(academy_id, athlete_id, snapshot_date DESC);

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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_athlete_progress_alert_kind CHECK (alert_kind IN ('alert', 'insight')),
  CONSTRAINT chk_athlete_progress_alert_severity CHECK (severity IN ('high', 'medium', 'low'))
);

CREATE INDEX IF NOT EXISTS idx_athlete_progress_alerts_lookup
  ON athlete_progress_alerts(academy_id, athlete_id, is_active, updated_at DESC);
