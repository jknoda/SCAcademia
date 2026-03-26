-- Flyway Migration: V3_1__Training_Techniques_Enhanced.sql
-- Phase 3.1: Enhance technique tables for Story 3.3 (Adicionar Técnicas)
-- Adds missing columns and creates technique_presets table
-- Dependencies: V3_0 (techniques, session_techniques)
-- Status: Independent, reversible via V3_1__undo if needed

-- ============================================================
-- 1. Enhance `techniques` table
-- Adds: icon_url, display_order, is_pending, created_by_professor_id
-- ============================================================

ALTER TABLE techniques
  ADD COLUMN IF NOT EXISTS icon_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_by_professor_id UUID REFERENCES users(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_techniques_display_order ON techniques(academy_id, display_order);
CREATE INDEX IF NOT EXISTS idx_techniques_pending ON techniques(academy_id, is_pending) WHERE is_pending = TRUE;

-- ============================================================
-- 2. Enhance `session_techniques` table
-- Adds: is_pending, updated_at, deleted_at
-- Relaxes: technique_order NOT NULL → nullable with default 0
-- Drops: order_positive CHECK constraint (not needed for wizard flow)
-- ============================================================

ALTER TABLE session_techniques
  ADD COLUMN IF NOT EXISTS is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Relax technique_order constraint so inserts can omit the column
ALTER TABLE session_techniques
  ALTER COLUMN technique_order DROP NOT NULL,
  ALTER COLUMN technique_order SET DEFAULT 0;

ALTER TABLE session_techniques
  DROP CONSTRAINT IF EXISTS order_positive;

CREATE INDEX IF NOT EXISTS idx_session_techniques_deleted ON session_techniques(session_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. Create `technique_presets` table (Favoritos do Professor)
-- ============================================================

CREATE TABLE IF NOT EXISTS technique_presets (
  preset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  technique_ids TEXT NOT NULL,          -- JSON array: ["uuid1","uuid2",...]
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_preset_per_professor UNIQUE (professor_id, academy_id, name)
);

CREATE INDEX IF NOT EXISTS idx_technique_presets_professor ON technique_presets(professor_id, academy_id);
CREATE INDEX IF NOT EXISTS idx_technique_presets_deleted ON technique_presets(professor_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 4. Seed: Basic judo techniques for test academy
-- Scoped to the seed data academy from seed-data.sql
-- (academies: 550e8400-e29b-41d4-a716-446655440001 = Academia de Judo Santos)
-- ============================================================

INSERT INTO techniques (technique_id, academy_id, name, category, display_order, is_pending, created_at, updated_at)
VALUES
  -- Técnicas Básicas (display_order 1-10)
  ('c0001111-0000-4000-a000-000000000001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Osoto Gari',    'Básica',    1, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ouchi Gari',   'Básica',    2, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Seoi Nage',    'Básica',    3, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000004'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Tai Otoshi',   'Básica',    4, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000005'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Uki Goshi',    'Básica',    5, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000006'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Koshi Guruma', 'Básica',    6, FALSE, NOW(), NOW()),
  -- Técnicas Avançadas (display_order 11-40)
  ('c0001111-0000-4000-a000-000000000011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Uchi Mata',        'Avançada', 11, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Harai Goshi',      'Avançada', 12, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000013'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Tomoe Nage',       'Avançada', 13, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000014'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Kata Guruma',      'Avançada', 14, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000015'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Sumi Gaeshi',      'Avançada', 15, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000016'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Tani Otoshi',      'Avançada', 16, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000017'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Yoko Shiho Gatame','Avançada', 17, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000018'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Juji Gatame',      'Avançada', 18, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000019'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Hadaka Jime',      'Avançada', 19, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000020'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ippon Seoi Nage',  'Avançada', 20, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000021'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ko Soto Gari',     'Avançada', 21, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000022'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ko Uchi Gari',     'Avançada', 22, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000023'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'De Ashi Harai',    'Avançada', 23, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000024'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Okuri Ashi Harai', 'Avançada', 24, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000025'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Sasae Tsuri Komi', 'Avançada', 25, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000026'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ashi Guruma',      'Avançada', 26, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000027'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Kesa Gatame',      'Avançada', 27, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000028'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Tate Shiho Gatame','Avançada', 28, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000029'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Kami Shiho Gatame','Avançada', 29, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000030'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ura Nage',         'Avançada', 30, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000031'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Sode Tsuri Komi',  'Avançada', 31, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000032'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Morote Seoi Nage', 'Avançada', 32, FALSE, NOW(), NOW()),
  ('c0001111-0000-4000-a000-000000000033'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'O Guruma',         'Avançada', 33, FALSE, NOW(), NOW())
ON CONFLICT (academy_id, name, deleted_at) DO NOTHING;
