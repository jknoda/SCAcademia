-- Flyway Migration: V2_0__Health_LGPD.sql
-- Phase 2: Health Records & LGPD Compliance
-- Tables: health_records, judo_profile, judo_belt_history, student_guardians, consents, consent_templates
-- Dependencies: V1 (users, academies)
-- Status: Independent, reversible

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- `health_records` (Encrypted Personal Data)
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
  CONSTRAINT reference_student CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = health_records.user_id AND role = 'Aluno')
  ),
  CONSTRAINT valid_blood_type CHECK (blood_type IS NULL OR blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'))
);

CREATE INDEX idx_health_records_user ON health_records(user_id);
CREATE INDEX idx_health_records_academy ON health_records(academy_id);

-- `judo_profile` (1:1 with Alunos)
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
  CONSTRAINT reference_student CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = judo_profile.student_id AND role = 'Aluno')
  ),
  CONSTRAINT unique_student_judo UNIQUE (student_id)
);

CREATE INDEX idx_judo_profile_student ON judo_profile(student_id);
CREATE INDEX idx_judo_profile_academy ON judo_profile(academy_id);
CREATE INDEX idx_judo_profile_belt ON judo_profile(academy_id, current_belt);
CREATE INDEX idx_judo_profile_federated ON judo_profile(academy_id, is_federated) WHERE is_federated = true;

-- `judo_belt_history` (Audit Trail for Belt Progression)
CREATE TABLE judo_belt_history (
  belt_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  belt VARCHAR(50) NOT NULL,
  received_date DATE NOT NULL,
  promoted_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_must_be_aluno CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = judo_belt_history.student_id AND role = 'Aluno')
  )
);

CREATE INDEX idx_judo_belt_history_student ON judo_belt_history(student_id, received_date DESC);
CREATE INDEX idx_judo_belt_history_academy ON judo_belt_history(academy_id, received_date DESC);
CREATE INDEX idx_judo_belt_history_promoted_by ON judo_belt_history(promoted_by_user_id);
CREATE INDEX idx_judo_belt_history_received_date ON judo_belt_history(academy_id, received_date);

-- `student_guardians` (Link Students to Guardians)
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
  CONSTRAINT student_must_be_aluno CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = student_guardians.student_id AND role = 'Aluno')
  ),
  CONSTRAINT guardian_must_be_responsavel CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = student_guardians.guardian_id AND role = 'Responsavel')
  ),
  CONSTRAINT unique_primary_guardian UNIQUE (student_id) WHERE is_primary = true,
  CONSTRAINT unique_guardian_relation UNIQUE (student_id, guardian_id)
);

CREATE INDEX idx_student_guardians_student ON student_guardians(student_id);
CREATE INDEX idx_student_guardians_guardian ON student_guardians(guardian_id);
CREATE INDEX idx_student_guardians_academy ON student_guardians(academy_id);
CREATE INDEX idx_student_guardians_primary ON student_guardians(academy_id, is_primary) WHERE is_primary = true;

-- `consents` (LGPD Digital Signatures)
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

-- `consent_templates` (Version Histories for LGPD)
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
-- MIGRATION COMPLETE — V2_0
-- ============================================================================
-- 6 tables created
-- LGPD compliance infrastructure ready
-- Encrypted fields for sensitive health data
-- Audit trails for belt progressions
