-- Story 5.3: Compliance reports persistence table
-- Additive migration for report metadata and artifact linkage

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  generated_by UUID NOT NULL REFERENCES users(user_id),
  report_data JSONB NOT NULL,
  file_path VARCHAR(500),
  signed_at TIMESTAMP,
  signature_hash VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_academy_created
  ON compliance_reports(academy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_not_deleted
  ON compliance_reports(academy_id)
  WHERE deleted_at IS NULL;
