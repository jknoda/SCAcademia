-- Flyway Migration: V1_0__Core_Identity.sql
-- Phase 1: Core Identity & Multi-tenancy Infrastructure
-- Tables: academies, users, roles, permissions, role_permissions, auth_tokens
-- Dependencies: None
-- Status: Independent, testable, reversible

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- MIGRATION COMPLETE — V1_0
-- ============================================================================
-- 5 tables created: academies, users, roles, permissions, role_permissions, auth_tokens
-- Multi-tenant infrastructure ready
-- All constraints and indexes in place
