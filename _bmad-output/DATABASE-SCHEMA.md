---
title: SCAcademia — Database Schema & Data Modeling
language: pt-BR
created: 2026-03-20
status: READY FOR DEVELOPMENT
version: 1.0
---

# SCAcademia — Database Schema & Modeling

**Data Model Version:** 1.0  
**Database:** PostgreSQL 14+  
**Architecture:** Multi-Tenant (Row-Level Security via `academy_id`)  
**Encryption:** AES-256 (health data), pgcrypto extension

---

## 📊 Mapa de Entidades (ER Diagram — Conceitual)

```
┌─────────────────────────────────────────────────────────────┐
│ Core Identity & Multi-Tenancy                               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ academies (1 tenant = N users)                          │ │
│ │  • academy_id (PK)                                      │ │
│ │  • name, description, document (CNPJ)                  │ │
│ │  • contact_email, contact_phone                         │ │
│ │  • address (street, number, complement, neighborhood)  │ │
│ │  • address (postal_code, city, state)                  │ │
│ │  • created_at, updated_at, deleted_at (soft-delete)    │ │
│ └────────────────┬────────────────────────────────────────┘ │
│                  │ (1:N)                                     │
│                  √                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ users (Professor, Aluno, Admin, Responsavel)           │ │
│ │  • user_id (PK)                                         │ │
│ │  • academy_id (FK) ← Multi-tenant key                  │ │
│ │  • email, password_hash (bcrypt), phone                │ │
│ │  • role (Admin|Professor|Aluno|Responsavel)            │ │
│ │  • full_name, document_id (CPF), birth_date            │ │
│ │  • address (street, number, complement, neighborhood)  │ │
│ │  • address (postal_code/CEP, city, state/UF)           │ │
│ │  • data_entrada, data_saida                             │ │
│ │  • minor_consent_signed, is_active                     │ │
│ │  • created_at, updated_at, deleted_at                  │ │
│ │  • last_login_at                                        │ │
│ └────────────────┬────────────────────────────────────────┘ │
│                  │                                           │
│                  └─→ roles (RBAC)                            │
│                  └─→ user_permissions                        │
│                  └─→ auth_tokens (JWT)                       │
│                  └─→ audit_logs (LGPD)                       │
│                  └─→ student_guardians (Students→Guardians)  │
│                  └─→ judo_profile (Students→Judo Data 1:1)   │
│                       └─→ judo_belt_history (Histórico de Faixas)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Health & LGPD Compliance (Encrypted)                        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ health_records (AES-256 encrypted in DB)               │ │
│ │  • health_record_id (PK)                                │ │
│ │  • user_id (FK) → Student                              │ │
│ │  • academy_id (FK)                                      │ │
│ │  • blood_type (O+, O-, A+, A-, B+, B-, AB+, AB-)      │ │
│ │  • peso (kg), altura (cm)                               │ │
│ │  • health screening (hypertension, diabetes, cardiac)  │ │
│ │  • allergies (encrypted)                                │ │
│ │  • medications (encrypted)                              │ │
│ │  • existing_conditions (encrypted)                     │ │
│ │  • emergency_contact (encrypted)                        │ │
│ │  • created_at, updated_at                              │ │
│ └────────────┬───────────────────────────────────────────┘ │
│              │ (1:N)                                        │
│              √                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ consents (LGPD Digital Signature)                       │ │
│ │  • consent_id (PK)                                      │ │
│ │  • user_id (FK)                                         │ │
│ │  • academy_id (FK)                                      │ │
│ │  • consent_type (health|ethics|privacy)                │ │
│ │  • consent_template_version                             │ │
│ │  • status (pending|accepted|declined|expired)          │ │
│ │  • signed_at, expires_at                                │ │
│ │  • signature_image (digital)                            │ │
│ │  • created_at, updates_at                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ consent_templates (Version History)                    │ │
│ │  • template_id (PK)                                     │ │
│ │  • version (1, 2, 3...)                                 │ │
│ │  • academy_id (FK)                                      │ │
│ │  • content (markdown)                                   │ │
│ │  • active (bool)                                        │ │
│ │  • created_at, effective_at, expires_at                │ │
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Training & Progress (Core Business Logic)                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ turmas (Classes / Groups)                              │ │
│ │  • turma_id (PK)                                        │ │
│ │  • academy_id (FK)                                      │ │
│ │  • professor_id (FK) → User (Professor)               │ │
│ │  • name (ex: "Terça-Feira 19h")                        │ │
│ │  • description                                          │ │
│ │  • schedule (JSON: {day, time, duration})             │ │
│ │  • created_at, updated_at, deleted_at                  │ │
│ └────────────────┬────────────────────────────────────────┘ │
│                  │ (1:N)                                     │
│                  √                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ turma_students (enrollment)                             │ │
│ │  • enrollment_id (PK)                                   │ │
│ │  • turma_id (FK)                                        │ │
│ │  • student_id (FK) → User                              │ │
│ │  • academy_id (FK)                                      │ │
│ │  • enrolled_at, dropped_at                              │ │
│ │  • status (active|on_hold|dropped)                      │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ training_sessions (Workouts recorded by Professor)     │ │
│ │  • session_id (PK)                                      │ │
│ │  • turma_id (FK)                                        │ │
│ │  • professor_id (FK)                                    │ │
│ │  • academy_id (FK)                                      │ │
│ │  • session_date, session_time                           │ │
│ │  • duration_minutes                                     │ │
│ │  • notes (textarea)                                     │ │
│ │  • created_at, updated_at, deleted_at (soft-delete)    │ │
│ └────────────────┬────────────────────────────────────────┘ │
│                  │ (1:N)                                     │
│                  └─→ session_attendance (frequency)         │
│                  └─→ session_techniques (techniques used)   │
│                  └─→ session_comments (per-student notes)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Session Details (Attendance, Techniques, Comments)          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ session_attendance (Frequency marking)                  │ │
│ │  • attendance_id (PK)                                   │ │
│ │  • session_id (FK)                                      │ │
│ │  • student_id (FK)                                      │ │
│ │  • academy_id (FK)                                      │ │
│ │  • status (present|absent|justified)                    │ │
│ │  • created_at, updated_at                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ session_techniques (Techniques used in session)        │ │
│ │  • session_technique_id (PK)                           │ │
│ │  • session_id (FK)                                      │ │
│ │  • technique_id (FK)                                    │ │
│ │  • academy_id (FK)                                      │ │
│ │  • order (1, 2, 3...) -- sequence in session           │ │
│ │  • created_at                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ techniques (Library of available techniques)           │ │
│ │  • technique_id (PK)                                    │ │
│ │  • academy_id (FK)                                      │ │
│ │  • name (ex: "Alongamento Estático")                  │ │
│ │  • description                                          │ │
│ │  • category (strength|cardio|flexibility|balance)      │ │
│ │  • is_favorite (bool)                                   │ │
│ │  • created_at, updated_at, deleted_at                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ session_comments (Per-student notes/observations)      │ │
│ │  • comment_id (PK)                                      │ │
│ │  • session_id (FK)                                      │ │
│ │  • student_id (FK)                                      │ │
│ │  • professor_id (FK)                                    │ │
│ │  • academy_id (FK)                                      │ │
│ │  • content (textarea, auto-saved)                       │ │
│ │  • sentiment (positive|neutral|negative)                │ │
│ │  • created_at, updated_at, deleted_at                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Progress Tracking & Gamification (Student Engagement)       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ student_progress (Aggregate metrics per student)       │ │
│ │  • progress_id (PK)                                     │ │
│ │  • student_id (FK)                                      │ │
│ │  • academy_id (FK)                                      │ │
│ │  • total_sessions                                       │ │
│ │  • total_attendance_percentage                          │ │
│ │  • streak_current                                       │ │
│ │  • streak_longest                                       │ │
│ │  • badges_earned_count                                  │ │
│ │  • last_updated_at                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ badges (Rewards for achievements)                      │ │
│ │  • badge_id (PK)                                        │ │
│ │  • academy_id (FK)                                      │ │
│ │  • name (ex: "Série de 10")                           │ │
│ │  • description                                          │ │
│ │  • icon_url                                             │ │
│ │  • criteria_type (streak|attendance|sessions_total)    │ │
│ │  • criteria_value (10, 50, 100...)                     │ │
│ │  • created_at                                           │ │
│ └────────────────┬────────────────────────────────────────┘ │
│                  │ (1:N)                                     │
│                  √                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ student_badges (Badge earned by student)               │ │
│ │  • earned_id (PK)                                       │ │
│ │  • badge_id (FK)                                        │ │
│ │  • student_id (FK)                                      │ │
│ │  • academy_id (FK)                                      │ │
│ │  • earned_at (timestamp)                                │ │
│ │  • notified_at                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Audit Logging & LGPD Compliance (Immutable)                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ audit_logs (Append-only LGPD compliance trail)         │ │
│ │  • log_id (PK)                                          │ │
│ │  • academy_id (FK)                                      │ │
│ │  • resource_type (users|health_records|consent|etc)   │ │
│ │  • resource_id                                          │ │
│ │  • action (read|create|update|delete)                  │ │
│ │  • actor_user_id (WHO made the change)                 │ │
│ │  • changes_json (before/after values)                  │ │
│ │  • ip_address, user_agent                              │ │
│ │  • timestamp (immutable, never modified)               │ │
│ │  • retention_until (auto-delete after 7 years)         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Offline Sync & Notification Infrastructure                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ sync_queue (Offline changes ready to sync)             │ │
│ │  • queue_id (PK)                                        │ │
│ │  • user_id (FK)                                         │ │
│ │  • academy_id (FK)                                      │ │
│ │  • resource_type                                        │ │
│ │  • resource_id                                          │ │
│ │  • action (create|update|delete)                        │ │
│ │  • payload_json (changes to apply)                      │ │
│ │  • status (pending|synced|failed)                       │ │
│ │  • retry_count                                          │ │
│ │  • client_timestamp, server_received_timestamp          │ │
│ │  • error_message (if failed)                            │ │
│ │  • created_at, synced_at                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ notifications (Push/Email/In-app)                      │ │
│ │  • notification_id (PK)                                 │ │
│ │  • user_id (FK)                                         │ │
│ │  • academy_id (FK)                                      │ │
│ │  • type (badge_earned|attendance_reminder|alert)      │ │
│ │  • title, message                                       │ │
│ │  • channels (push|email|in_app) -- bitmask             │ │
│ │  • status (pending|sent|failed)                         │ │
│ │  • sent_at, read_at                                     │ │
│ │  • created_at                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Admin & System Monitoring                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ system_health (Health metrics snapshots)                │ │
│ │  • health_id (PK)                                       │ │
│ │  • academy_id (FK)                                      │ │
│ │  • component (api|database|cache|auth)                  │ │
│ │  • status (green|yellow|red)                            │ │
│ │  • cpu_percent, memory_percent, disk_percent            │ │
│ │  • response_time_ms, error_count                        │ │
│ │  • timestamp                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ alerts (System & compliance alerts)                    │ │
│ │  • alert_id (PK)                                        │ │
│ │  • academy_id (FK)                                      │ │
│ │  • severity (info|warning|critical)                     │ │
│ │  • title, description                                   │ │
│ │  • alert_type (system|compliance|performance)          │ │
│ │  • status (active|acknowledged|resolved)               │ │
│ │  • created_at, acknowledged_at, resolved_at             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tabelas Detalhadas (DDL)

### **1. CORE IDENTITY & MULTI-TENANCY**

#### `academies` (Tenant Root)
```sql
CREATE TABLE academies (
  academy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_id VARCHAR(20) UNIQUE NOT NULL, -- CNPJ: 00.000.000/0000-00
  
  -- Contact
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100), -- bairro
  address_postal_code VARCHAR(10), -- CEP
  address_city VARCHAR(100),
  address_state CHAR(2), -- UF
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  max_users INTEGER DEFAULT 1000,
  storage_limit_gb INTEGER DEFAULT 10,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- Soft-delete for LGPD compliance
  
  CONSTRAINT academy_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT academy_email_format CHECK (contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_academies_document ON academies(document_id);
CREATE INDEX idx_academies_deleted_at ON academies(deleted_at) WHERE deleted_at IS NULL;
```

#### `users` (All User Types)
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE RESTRICT,
  
  -- Authentication
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash (60 chars)
  
  -- Profile
  full_name VARCHAR(255) NOT NULL,
  document_id VARCHAR(20), -- CPF: 000.000.000-00
  birth_date DATE,
  phone VARCHAR(20), -- fone (contact)
  
  -- Address
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100), -- bairro
  address_postal_code VARCHAR(10), -- CEP
  address_city VARCHAR(100),
  address_state CHAR(2), -- UF
  
  -- Role & Status
  role VARCHAR(50) NOT NULL, -- Admin|Professor|Aluno|Responsavel
  is_active BOOLEAN DEFAULT true,
  
  -- Parental Consent (for minors)
  is_minor BOOLEAN DEFAULT false,
  minor_consent_signed BOOLEAN DEFAULT false,
  
  -- Judo Academy Timeline
  data_entrada DATE,  -- Data de entrada (quando começou na academia)
  data_saida DATE,    -- Data de saída (quando saiu da academia)
  
  -- Security & Tracking
  last_login_at TIMESTAMP,
  password_changed_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- Soft-delete for LGPD
  
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
```

#### `roles` (RBAC - Role Definitions)
```sql
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  
  role_name VARCHAR(100) NOT NULL, -- Admin, Professor, Aluno, Responsavel
  description TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_role_per_academy UNIQUE (academy_id, role_name)
);

CREATE INDEX idx_roles_academy ON roles(academy_id);
```

#### `permissions` (RBAC - Granular Permissions)
```sql
CREATE TABLE permissions (
  permission_id SERIAL PRIMARY KEY,
  
  resource VARCHAR(100) NOT NULL, -- users, training_sessions, audit_logs, etc
  action VARCHAR(50) NOT NULL,    -- read, create, update, delete, export
  scope VARCHAR(100),              -- own, academy, all
  
  description TEXT,
  
  CONSTRAINT unique_permission UNIQUE (resource, action, scope)
);

-- Insert sample permissions (managed by admin)
-- Example: INSERT INTO permissions VALUES (1, 'training_sessions', 'create', 'own', 'Create own training session');
```

#### `role_permissions` (RBAC - Assignment)
```sql
CREATE TABLE role_permissions (
  role_permission_id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
```

#### `auth_tokens` (JWT Token Tracking)
```sql
CREATE TABLE auth_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  token_type VARCHAR(50) NOT NULL, -- access|refresh
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash of actual token (never store full token)
  
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  
  ip_address VARCHAR(45), -- IPv6 support
  user_agent TEXT,
  
  CONSTRAINT token_expiry CHECK (expires_at > issued_at)
);

CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id, token_type);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at) WHERE revoked_at IS NULL;
```

---

### **2. HEALTH & LGPD COMPLIANCE**

#### `health_records` (Encrypted AES-256)
```sql
CREATE TABLE health_records (
  health_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  -- Blood Type
  blood_type VARCHAR(5), -- O+, O-, A+, A-, B+, B-, AB+, AB-
  
  -- Anthropometric Data
  weight_kg NUMERIC(5,2), -- Peso em kg (ex: 75.50)
  height_cm INT,          -- Altura em cm (ex: 180)
  
  -- Health Screening Questions (SIM/NÃO)
  hypertension BOOLEAN, -- Hipertensão?
  diabetes BOOLEAN,     -- Diabetes?
  cardiac BOOLEAN,      -- Cardíaco?
  labyrinthitis BOOLEAN, -- Labirintite?
  asthma_bronchitis BOOLEAN, -- Asma/Bronquite?
  epilepsy_seizures BOOLEAN, -- Epilepsia/convulsões?
  stress_depression BOOLEAN, -- Stress/depressão?
  health_screening_notes TEXT, -- Notas adicionais sobre screening
  
  -- Encrypted fields (use pgcrypto)
  allergies_encrypted BYTEA,           -- pgcrypto: encrypt(text)
  medications_encrypted BYTEA,
  existing_conditions_encrypted BYTEA,
  emergency_contact_encrypted BYTEA,
  
  -- Metadata
  created_by_user_id UUID REFERENCES users(user_id),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT reference_student CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = health_records.user_id AND role = 'Aluno')
  ),
  CONSTRAINT valid_blood_type CHECK (blood_type IS NULL OR blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'))
);

CREATE INDEX idx_health_records_user ON health_records(user_id);
CREATE INDEX idx_health_records_academy ON health_records(academy_id);
```

#### `judo_profile` (Dados Específicos do Judo - Relação 1:1 com alunos)
```sql
CREATE TABLE judo_profile (
  judo_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  
  -- Federation Status
  is_federated BOOLEAN DEFAULT false, -- Federado?
  federation_registration VARCHAR(100),  -- Nº registro na federação
  federation_date DATE,                  -- Data de federação
  
  -- Judo Belt (Faixa)
  current_belt VARCHAR(50), -- Sequência: branca → branca_ponta_bordô → bordô → ... → preta → coral → vermelha
  belt_date DATE,           -- Data que conquistou a faixa atual
  
  -- Metadata
  created_by_user_id UUID REFERENCES users(user_id),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT reference_student CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = judo_profile.student_id AND role = 'Aluno')
  ),
  CONSTRAINT unique_student_judo UNIQUE (student_id) -- Garante relação 1:1
);

CREATE INDEX idx_judo_profile_student ON judo_profile(student_id);
CREATE INDEX idx_judo_profile_academy ON judo_profile(academy_id);
CREATE INDEX idx_judo_profile_belt ON judo_profile(academy_id, current_belt);
CREATE INDEX idx_judo_profile_federated ON judo_profile(academy_id, is_federated) WHERE is_federated = true;
```

#### `judo_belt_history` (Histórico de Faixas - Auditoria)
```sql
CREATE TABLE judo_belt_history (
  belt_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  
  -- Belt Information
  belt VARCHAR(50) NOT NULL, -- Faixa que o aluno recebeu (ex: branca, branca_ponta_bordô, etc)
  received_date DATE NOT NULL, -- Data que o aluno recebeu a faixa
  
  -- Who promoted
  promoted_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- Professor/Admin que promoveu
  
  -- Additional Info
  notes TEXT, -- Observações sobre a promoção (ex: "Desempenho excepcionalmente bom", "Prova realizada em xxx")
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT student_must_be_aluno CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = judo_belt_history.student_id AND role = 'Aluno')
  )
);

-- Índices para consultas de histórico
CREATE INDEX idx_judo_belt_history_student ON judo_belt_history(student_id, received_date DESC);
CREATE INDEX idx_judo_belt_history_academy ON judo_belt_history(academy_id, received_date DESC);
CREATE INDEX idx_judo_belt_history_promoted_by ON judo_belt_history(promoted_by_user_id);
CREATE INDEX idx_judo_belt_history_received_date ON judo_belt_history(academy_id, received_date);
```

#### `consents` (Digital Signature, Versioned)
```sql
CREATE TABLE consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  -- Consent Template Info
  consent_template_version INT NOT NULL,
  consent_type VARCHAR(100) NOT NULL, -- health|ethics|privacy
  
  -- Status Tracking
  status VARCHAR(50) NOT NULL, -- pending|accepted|declined|expired|withdrawn
  
  -- Signature
  signature_image BYTEA, -- Digital signature bytes
  signed_by_user_id UUID REFERENCES users(user_id),
  guardian_id UUID REFERENCES users(user_id), -- Se aluno é menor, guardião que assina
  
  -- Timestamps
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
```

#### `student_guardians` (Linking Students to Guardians)
```sql
CREATE TABLE student_guardians (
  student_guardian_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Relationship Type
  relationship VARCHAR(100), -- Mãe|Pai|Avó|Avô|Tio|Tia|Tutor|Outro
  is_primary BOOLEAN DEFAULT false, -- Responsável principal
  
  -- Timestamps
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
CREATE INDEX idx_student_guardians_primary ON student_guardians(Academy_id, is_primary) WHERE is_primary = true;
```

#### `consent_templates` (Version History)
```sql
CREATE TABLE consent_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  version INT NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  
  content TEXT NOT NULL, -- Markdown or HTML
  
  is_active BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  CONSTRAINT unique_template_version UNIQUE (academy_id, consent_type, version),
  CONSTRAINT version_positive CHECK (version > 0)
);

CREATE INDEX idx_consent_templates_academy_active ON consent_templates(academy_id, is_active);
```

---

### **3. TRAINING & PROGRESS**

#### `turmas` (Classes / Groups)
```sql
CREATE TABLE turmas (
  turma_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  
  name VARCHAR(255) NOT NULL, -- Ex: "Terça-Feira 19h"
  description TEXT,
  
  -- Schedule (stored as JSON for flexibility)
  schedule_json JSONB, -- {day_of_week: int (0-6), time: "19:00", duration_minutes: 60}
  
  -- Metadata
  capacity INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT unique_turma_per_professor UNIQUE (professor_id, name, deleted_at),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_turmas_academy ON turmas(academy_id);
CREATE INDEX idx_turmas_professor ON turmas(professor_id, is_active);
CREATE INDEX idx_turmas_deleted_at ON turmas(deleted_at) WHERE deleted_at IS NULL;
```

#### `turma_students` (Enrollment)
```sql
CREATE TABLE turma_students (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(turma_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  status VARCHAR(50) NOT NULL, -- active|on_hold|dropped
  
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dropped_at TIMESTAMP,
  
  CONSTRAINT unique_enrollment UNIQUE (turma_id, student_id),
  CONSTRAINT student_is_aluno CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = turma_students.student_id AND role = 'Aluno')
  )
);

CREATE INDEX idx_turma_students_turma ON turma_students(turma_id, status);
CREATE INDEX idx_turma_students_student ON turma_students(student_id, status);
```

#### `training_sessions` (Workouts)
```sql
CREATE TABLE training_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(turma_id) ON DELETE RESTRICT,
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  
  notes TEXT, -- General notes about session
  
  -- Offline sync metadata
  offline_synced_at TIMESTAMP,
  client_created_at TIMESTAMP, -- When created on offline client
  server_received_at TIMESTAMP,
  last_write_wins_timestamp TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT duration_positive CHECK (duration_minutes > 0)
);

CREATE INDEX idx_training_sessions_turma ON training_sessions(turma_id, session_date);
CREATE INDEX idx_training_sessions_professor ON training_sessions(professor_id, session_date);
CREATE INDEX idx_training_sessions_academy ON training_sessions(academy_id, session_date);
CREATE INDEX idx_training_sessions_synced ON training_sessions(academy_id, offline_synced_at) WHERE offline_synced_at IS NULL;
```

#### `session_attendance` (Frequency)
```sql
CREATE TABLE session_attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  status VARCHAR(50) NOT NULL, -- present|absent|justified
  
  marked_by_user_id UUID NOT NULL REFERENCES users(user_id),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_attendance_per_session UNIQUE (session_id, student_id),
  CONSTRAINT valid_status CHECK (status IN ('present', 'absent', 'justified'))
);

CREATE INDEX idx_session_attendance_student ON session_attendance(student_id, academy_id);
CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
```

#### `techniques` (Library)
```sql
CREATE TABLE techniques (
  technique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- strength|cardio|flexibility|balance|mobility|sport_specific
  
  is_favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT unique_technique_per_academy UNIQUE (academy_id, name, deleted_at),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_techniques_academy ON techniques(academy_id, is_favorite);
CREATE INDEX idx_techniques_category ON techniques(academy_id, category);
```

#### `session_techniques` (Which techniques used in session)
```sql
CREATE TABLE session_techniques (
  session_technique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES techniques(technique_id) ON DELETE RESTRICT,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  technique_order INT NOT NULL, -- Sequence in session (1, 2, 3...)
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_technique_per_session UNIQUE (session_id, technique_id),
  CONSTRAINT order_positive CHECK (technique_order > 0)
);

CREATE INDEX idx_session_techniques_session ON session_techniques(session_id, technique_order);
```

#### `session_comments` (Per-student notes)
```sql
CREATE TABLE session_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  content TEXT NOT NULL, -- Auto-saved textarea
  sentiment VARCHAR(50), -- positive|neutral|negative
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT unique_comment_per_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX idx_session_comments_student ON session_comments(student_id, academy_id);
CREATE INDEX idx_session_comments_session ON session_comments(session_id);
```

---

### **4. PROGRESS TRACKING & GAMIFICATION**

#### `student_progress` (Aggregated Metrics)
```sql
CREATE TABLE student_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  -- Metrics (aggregated from training_sessions + session_attendance)
  total_sessions INT DEFAULT 0,
  total_attendance INT DEFAULT 0,
  total_attendance_percentage NUMERIC(5,2) DEFAULT 0, -- 0.00 - 100.00
  
  -- Streaks
  streak_current INT DEFAULT 0, -- Current consecutive attendances
  streak_longest INT DEFAULT 0, -- Best streak ever
  
  -- Badges
  badges_earned_count INT DEFAULT 0,
  
  -- Timestamps
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE UNIQUE INDEX idx_student_progress_student_academy ON student_progress(student_id, academy_id);
```

#### `badges` (Library)
```sql
CREATE TABLE badges (
  badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(1024),
  
  -- Criteria for earning badge
  criteria_type VARCHAR(100) NOT NULL, -- streak|attendance_percentage|sessions_total|milestone
  criteria_value INT, -- 10 consecutive, 80% attendance, 50 sessions, etc
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_badge_per_academy UNIQUE (academy_id, name),
  CONSTRAINT valid_criteria CHECK (criteria_type IN ('streak', 'attendance_percentage', 'sessions_total', 'milestone'))
);

CREATE INDEX idx_badges_academy ON badges(academy_id);
```

#### `student_badges` (Earned)
```sql
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
```

---

### **5. AUDIT LOGGING & LGPD (Immutable)**

#### `audit_logs` (Append-Only)
```sql
CREATE TABLE audit_logs (
  log_id BIGSERIAL PRIMARY KEY, -- Immutable sequence
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  -- What happened
  resource_type VARCHAR(100) NOT NULL, -- users|health_records|consents|training_sessions|etc
  resource_id VARCHAR(100) NOT NULL,   -- UUID of resource
  action VARCHAR(50) NOT NULL,         -- create|read|update|delete|export|download
  
  -- Who did it
  actor_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  
  -- Changes (JSON for flexibility)
  changes_json JSONB, -- {field: {old_value, new_value}} or null for read/delete
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Immutable timestamp
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Retention
  retention_until TIMESTAMP, -- Auto-delete after 7 years (LGPD requirement)
  
  CONSTRAINT resource_id_not_empty CHECK (length(trim(resource_id)) > 0)
);

-- IMMUTABLE: No UPDATE or DELETE allowed on audit_logs (enforce at application level + GRANTs)
-- CREATE POLICY audit_logs_no_update ON audit_logs
--   AS PERMISSIVE FOR UPDATE
--   USE (FALSE);

CREATE INDEX idx_audit_logs_academy ON audit_logs(academy_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_retention ON audit_logs(retention_until) WHERE retention_until IS NOT NULL;
```

---

### **6. OFFLINE SYNC & NOTIFICATIONS**

#### `sync_queue` (Offline Changes)
```sql
CREATE TABLE sync_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  -- What to sync
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- create|update|delete
  
  -- Payload
  payload_json JSONB NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending|synced|failed
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  
  -- Timestamps
  client_timestamp TIMESTAMP NOT NULL, -- When created on client (offline)
  server_received_timestamp TIMESTAMP, -- When server received
  synced_at TIMESTAMP,
  
  -- Error info
  error_message TEXT,
  error_code VARCHAR(100),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'synced', 'failed'))
);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id, status);
CREATE INDEX idx_sync_queue_pending ON sync_queue(academy_id, status) WHERE status = 'pending';
CREATE INDEX idx_sync_queue_failed ON sync_queue(academy_id, status) WHERE status = 'failed';
```

#### `notifications` (Push/Email/In-app)
```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  type VARCHAR(100) NOT NULL, -- badge_earned|attendance_reminder|alert_system|comment_received
  
  title VARCHAR(255),
  message TEXT,
  
  -- Channels to deliver (bitmask: 1=push, 2=email, 4=in_app)
  channels INT NOT NULL DEFAULT 7, -- 0b111 = all channels
  
  -- Delivery status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending|sent|failed|bounced
  
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Delivery tracking
  delivery_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  CONSTRAINT valid_type CHECK (type IN ('badge_earned', 'attendance_reminder', 'alert_system', 'comment_received')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  CONSTRAINT valid_channels CHECK (channels >= 0 AND channels <= 7)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_notifications_pending ON notifications(academy_id, status) WHERE status = 'pending';
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at);
```

---

### **7. ADMIN & SYSTEM MONITORING**

#### `system_health` (Snapshots)
```sql
CREATE TABLE system_health (
  health_id BIGSERIAL PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  component VARCHAR(100) NOT NULL, -- api|database|cache|auth|storage
  status VARCHAR(50) NOT NULL,      -- green|yellow|red
  
  -- Metrics
  cpu_percent NUMERIC(5,2),         -- 0.00 - 100.00
  memory_percent NUMERIC(5,2),
  disk_percent NUMERIC(5,2),
  
  response_time_ms INT,     -- API response time
  error_count INT DEFAULT 0,
  
  details_json JSONB,       -- Additional details
  
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_component CHECK (component IN ('api', 'database', 'cache', 'auth', 'storage')),
  CONSTRAINT valid_status CHECK (status IN ('green', 'yellow', 'red')),
  CONSTRAINT valid_cpu CHECK (cpu_percent IS NULL OR (cpu_percent >= 0 AND cpu_percent <= 100))
);

CREATE INDEX idx_system_health_academy ON system_health(academy_id, component, timestamp DESC);
CREATE INDEX idx_system_health_status ON system_health(academy_id, status) WHERE status != 'green';
```

#### `alerts` (System & Compliance)
```sql
CREATE TABLE alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  
  severity VARCHAR(50) NOT NULL, -- info|warning|critical
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  alert_type VARCHAR(100) NOT NULL, -- system|compliance|performance|security
  
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active|acknowledged|resolved
  
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
```

---

## 🥋 Judo Belt Management & History

### Overview

O sistema mantém um **histórico completo** de mudanças de faixas para cada aluno:

- **`judo_profile`** — Armazena a faixa ATUAL e a data em que foi conquistada
  - Usado para consultas rápidas de status atual (performance)
  - Nunca é deletado (apenas atualizado)

- **`judo_belt_history`** — Registro imutável de TODAS as faixas que o aluno recebeu
  - Mantém auditoria de progressão
  - Rastreia quem promoveu o aluno
  - Permite análise de histórico completo

### Workflow de Promoção de Faixa

```sql
-- 1. INSERIR nova faixa no histórico
INSERT INTO judo_belt_history (student_id, academy_id, belt, received_date, promoted_by_user_id, notes)
VALUES (
  'xxx-student-uuid',
  'yyy-academy-uuid',
  'branca_ponta_bordô', -- Nova faixa conquistada
  CURRENT_DATE,
  'zzz-professor-uuid', -- Quem promoveu
  'Aprovado na avaliação de técnica. Desempenho excelente.'
);

-- 2. ATUALIZAR faixa atual em judo_profile
UPDATE judo_profile
SET 
  current_belt = 'branca_ponta_bordô',
  belt_date = CURRENT_DATE,
  updated_at = CURRENT_TIMESTAMP
WHERE student_id = 'xxx-student-uuid';

-- 3. REGISTRAR em audit_logs (automático via trigger, se implementado)
INSERT INTO audit_logs (academy_id, resource_type, resource_id, action, actor_user_id, changes_json)
VALUES ('yyy-academy-uuid', 'judo_profile', 'xxx-student-uuid', 'update', 'zzz-professor-uuid', 
  '{"current_belt": {"old": "branca", "new": "branca_ponta_bordô"}}');
```

### Consultas Úteis

**Obter faixa atual de um aluno:**
```sql
SELECT current_belt, belt_date FROM judo_profile WHERE student_id = 'xxx';
```

**Obter histórico completo de faixas (cronológico):**
```sql
SELECT 
  belt,
  received_date,
  promoted_by_user_id,
  notes,
  created_at
FROM judo_belt_history
WHERE student_id = 'xxx'
ORDER BY received_date ASC;
```

**Descobrir quanto tempo o aluno levou em cada faixa:**
```sql
SELECT 
  belt,
  received_date,
  LEAD(received_date) OVER (ORDER BY received_date) - received_date AS days_in_belt,
  notes
FROM judo_belt_history
WHERE student_id = 'xxx'
ORDER BY received_date ASC;
```

**Listar promotores (professores que promoveram alunos):**
```sql
SELECT 
  promoted_by_user_id,
  COUNT(*) as total_promoted,
  MAX(received_date) as last_promotion
FROM judo_belt_history
WHERE academy_id = 'yyy'
GROUP BY promoted_by_user_id
ORDER BY total_promoted DESC;
```

### Triggers Recomendados (Opcional)

Se desejar **automatizar** a atualização do histórico:

```sql
-- Trigger para registrar mudanças de faixa automaticamente
CREATE OR REPLACE FUNCTION log_belt_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_belt != OLD.current_belt THEN
    INSERT INTO judo_belt_history (student_id, academy_id, belt, received_date, updated_at)
    VALUES (NEW.student_id, NEW.academy_id, NEW.current_belt, NEW.belt_date, CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_judo_profile_belt_change
AFTER UPDATE ON judo_profile
FOR EACH ROW
EXECUTE FUNCTION log_belt_change();
```

**Nota:** O trigger acima registra apenas a faixa NOVA. Para registrar quem promoveu, recomenda-se fazer a inserção em `judo_belt_history` **antes** de atualizar `judo_profile` (approach transacional no backend).

---

## 🔐 Security Considerations

### Data Encryption

1. **Health Data (AES-256):**
   ```sql
   -- Encrypt on write:
   UPDATE health_records 
   SET allergies_encrypted = pgcrypto.encrypt(allergies::bytea, master_key::bytea)
   WHERE health_record_id = 'xxx';
   
   -- Decrypt on read:
   SELECT pgcrypto.decrypt(allergies_encrypted, master_key::bytea)::text as allergies
   FROM health_records;
   ```

2. **Backup Encryption (AES-256):**
   - Backups encrypted before storage (not in DB, managed by DevOps)

3. **Password Hashing (bcrypt):**
   ```sql
   -- Generate hash:
   password_hash := crypt(plain_password, gen_salt('bf', 12));
   
   -- Verify:
   SELECT crypt(plain_password, password_hash) = password_hash;
   ```

### Multi-Tenant Isolation

1. **Row-Level Security (RLS):**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   CREATE POLICY users_isolation ON users
     USING (academy_id = current_setting('app.academy_id')::uuid);
   ```

2. **Query Filtering (Application Layer - Recommended):**
   - Always include `academy_id` in WHERE clause
   - Never trust user input for academy_id (use JWT claim)

### Audit Trail (Immutable)

```sql
-- Prevent modifications to audit_logs
REVOKE UPDATE, DELETE ON audit_logs FROM public, app_role;

-- Allow only INSERT
GRANT INSERT ON audit_logs TO app_role;
GRANT SELECT ON audit_logs TO app_role;
```

---

## 📈 Indexing Strategy

### Primary Indexes (Must-Have)

| Table | Index | Purpose |
|-------|-------|---------|
| users | academy_id, email | User lookups |
| training_sessions | turma_id, session_date | Session queries |
| session_attendance | student_id, session_id | Attendance lookups |
| audit_logs | academy_id, timestamp DESC | Audit trail queries |
| consents | user_id, consent_type | LGPD consent lookups |
| student_progress | student_id | Progress aggregation |

### Performance Indexes (Should-Have)

| Index | Query Type | Estimated Benefit |
|-------|-----------|-------------------|
| idx_users_is_active | Filter active users | 50-80% faster |
| idx_training_sessions_synced | Offline sync queries | 60-90% faster |
| idx_notifications_pending | Notification delivery | 40-70% faster |
| idx_sync_queue_failed | Retry logic | 50-80% faster |

### Monitoring (Use EXPLAIN ANALYZE)

```sql
EXPLAIN ANALYZE
SELECT * FROM students 
JOIN session_attendance ON ... 
WHERE academy_id = 'xxx' AND session_date > NOW() - INTERVAL 1 MONTH;

-- Aim for: Index Scan (not Seq Scan) when possible
```

---

## 🗑️ Data Retention & LGPD

### Soft-Delete Strategy

**Soft-delete columns (never hard-delete unless requested):**
- users.deleted_at
- training_sessions.deleted_at
- audit_logs.retention_until (7-year retention)

### Right to Be Forgotten Implementation

```sql
-- Story 2.5: Right to Esquecimento
BEGIN TRANSACTION;
  
  -- 1. Soft-delete user
  UPDATE users SET deleted_at = NOW() WHERE user_id = 'xxx';
  
  -- 2. Hard-delete health data (per LGPD)
  DELETE FROM health_records WHERE user_id = 'xxx';
  
  -- 3. Log deletion in audit trail
  INSERT INTO audit_logs (resource_type, action, actor_user_id, ...)
  VALUES ('users', 'delete_on_request', current_user_id);
  
  -- 4. Anonymize training data (optional: replace names with hashes)
  UPDATE training_sessions 
  SET professor_id = NULL 
  WHERE professor_id = 'xxx' AND deleted_at IS NULL;
  
COMMIT;
```

---

## 📊 Query Performance Tips

### Common Queries (Optimized)

**Query 1: Get student progress dashboard**
```sql
-- Optimized with indexes
SELECT 
  sp.total_sessions,
  sp.total_attendance_percentage,
  sp.streak_current,
  sp.badges_earned_count,
  COUNT(DISTINCT sa.session_id) as current_month_sessions
FROM student_progress sp
LEFT JOIN session_attendance sa ON sp.student_id = sa.student_id 
  AND sa.created_at > CURRENT_DATE - INTERVAL 1 MONTH
WHERE sp.student_id = 'xxx' AND sp.academy_id = 'yyy'
GROUP BY sp.progress_id;

-- Expected: Index Scan on idx_student_progress_student
```

**Query 2: Get sessions for Professor dashboard**
```sql
SELECT 
  ts.session_id,
  ts.session_date,
  COUNT(sa.attendance_id) as total_attendance,
  SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as present_count
FROM training_sessions ts
LEFT JOIN session_attendance sa ON ts.session_id = sa.session_id
WHERE ts.professor_id = 'xxx' 
  AND ts.academy_id = 'yyy'
  AND ts.session_date BETWEEN CURRENT_DATE - 1 MONTH AND CURRENT_DATE
GROUP BY ts.session_id
ORDER BY ts.session_date DESC;

-- Expected: Index Scan on idx_training_sessions_professor
```

---

## ✅ Validation Constraints

### Data Integrity Checks

1. **User Role Consistency:**
   ```sql
   CONSTRAINT professor_has_turmas CHECK (
     EXISTS (SELECT 1 FROM users WHERE user_id = professor_id AND role = 'Professor')
   )
   ```

2. **Enrollment Consistency:**
   ```sql
   CONSTRAINT student_is_aluno CHECK (
     EXISTS (SELECT 1 FROM users WHERE user_id = student_id AND role = 'Aluno')
   )
   ```

3. **Session Date Validity:**
   ```sql
   CONSTRAINT session_date_not_future CHECK (session_date <= CURRENT_DATE)
   ```

4. **Consent Expiry:**
   ```sql
   CONSTRAINT consent_not_expired CHECK (
     status != 'expired' OR expires_at < NOW()
   )
   ```

---

## 📋 Migration Strategy

### Phase 1 — Initial Schema (Story 1.1)
- Create: academies, users, auth_tokens, roles, permissions
- Test: Multi-tenant isolation, JWT token validation

### Phase 2 — Health & LGPD (Story 2.1)
- Create: health_records, consents, consent_templates, audit_logs
- Test: Encryption, immutable audit trail

### Phase 3 — Training (Story 3.1)
- Create: turmas, turma_students, training_sessions, techniques, session_*

### Phase 4 — Progress (Story 4.1)
- Create: student_progress, badges, student_badges, notifications

### Phase 5 — Sync & Monitoring (Stories 6-8)
- Create: sync_queue, system_health, alerts

---

## 🚀 Next Steps for Review

**Before implementing:**

1. ✅ **Review entity relationships** — Any missing entities or relationships?
2. ✅ **Check data types** — Should any fields use different types (JSON vs TEXT, etc)?
3. ✅ **Validate constraints** — Are business rules captured in DDL?
4. ✅ **Performance review** — Are indexes sufficient for your query patterns?
5. ✅ **Security review** — Is encryption strategy adequate?

**Feedback needed on:**

- Should we use separate database per academy (alternative to multi-tenant)?
- Is AES-256 encryption adequate or need HSM?
- JSON fields (JSONB) vs normalized tables for schedule/details?
- Retention policy for audit_logs (7 years adequate)?

---

**Data Model Version:** 1.0  
**Status:** ✅ READY FOR REVIEW  
**Generated:** 2026-03-20

