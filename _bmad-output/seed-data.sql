-- SCAcademia — Seed Data (Development)
-- Sample data for testing and development
-- Status: Idempotent (safe to re-run)
-- Language: PT-BR

-- ============================================================================
-- 1. ACADEMIES
-- ============================================================================

INSERT INTO academies (academy_id, name, document_id, contact_email, contact_phone, address_city, address_state, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Academia de Judo Santos', '12345678000195', 'contato@judosantos.com.br', '(11) 98765-4321', 'Santos', 'SP', true),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Dojo Campinas Martial Arts', '98765432000187', 'contato@dojo.cam.br', '(19) 99876-5432', 'Campinas', 'SP', true),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Judo Ribeirão Preto', '55555555000100', 'contato@judorp.br', '(16) 98888-7777', 'Ribeirão Preto', 'SP', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. USERS (Admins, Professors, Students, Guardians)
-- ============================================================================

-- ACADEMY 1: Santos - Admin
INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, is_active, data_entrada)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'admin@judosantos.com.br', '$2a$10$hash_admin_001', 'Carlos Silva', 'Admin', true, '2025-01-01'::date)
ON CONFLICT DO NOTHING;

-- ACADEMY 1: Santos - Professors
INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, is_active, data_entrada, birth_date)
VALUES
  ('650e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'prof.joao@judosantos.com.br', '$2a$10$hash_prof_001', 'João Santos', 'Professor', true, '2025-01-15'::date, '1980-05-10'::date),
  ('650e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'prof.maria@judosantos.com.br', '$2a$10$hash_prof_002', 'Maria Oliveira', 'Professor', true, '2025-01-20'::date, '1985-08-22'::date),
  ('650e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'prof.pedro@judosantos.com.br', '$2a$10$hash_prof_003', 'Pedro Costa', 'Professor', true, '2025-02-01'::date, '1978-03-15'::date)
ON CONFLICT DO NOTHING;

-- ACADEMY 1: Santos - Guardians (Responsaveis)
INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, is_active, data_entrada)
VALUES
  ('650e8400-e29b-41d4-a716-446655440031'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'resp.lucia@judosantos.com.br', '$2a$10$hash_resp_001', 'Lúcia Silva', 'Responsavel', true, '2025-01-15'::date),
  ('650e8400-e29b-41d4-a716-446655440032'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'resp.henrique@judosantos.com.br', '$2a$10$hash_resp_002', 'Henrique Pereira', 'Responsavel', true, '2025-01-20'::date),
  ('650e8400-e29b-41d4-a716-446655440033'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'resp.ana@judosantos.com.br', '$2a$10$hash_resp_003', 'Ana Costa', 'Responsavel', true, '2025-02-10'::date)
ON CONFLICT DO NOTHING;

-- ACADEMY 1: Santos - Students (Alunos)
INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, is_active, is_minor, data_entrada, birth_date)
VALUES
  ('650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'aluno.bruno@judosantos.com.br', '$2a$10$hash_aluno_001', 'Bruno Silva Santos', 'Aluno', true, true, '2025-01-20'::date, '2012-06-15'::date),
  ('650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'aluno.lucas@judosantos.com.br', '$2a$10$hash_aluno_002', 'Lucas Oliveira Pereira', 'Aluno', true, true, '2025-01-22'::date, '2011-08-22'::date),
  ('650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'aluno.rafael@judosantos.com.br', '$2a$10$hash_aluno_003', 'Rafael Costa Martins', 'Aluno', true, true, '2025-02-01'::date, '2010-03-08'::date),
  ('650e8400-e29b-41d4-a716-446655440054'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'aluno.biel@judosantos.com.br', '$2a$10$hash_aluno_004', 'Gabriel Rodrigues', 'Aluno', true, true, '2025-02-05'::date, '2012-11-30'::date),
  ('650e8400-e29b-41d4-a716-446655440055'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'aluno.mateus@judosantos.com.br', '$2a$10$hash_aluno_005', 'Mateus de Souza', 'Aluno', true, true, '2025-02-10'::date, '2009-07-12'::date)
ON CONFLICT DO NOTHING;

-- ACADEMY 2: Campinas - Admin
INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, is_active, data_entrada)
VALUES
  ('650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'admin@dojo.cam.br', '$2a$10$hash_admin_002', 'Fernando Costa', 'Admin', true, '2025-01-01'::date)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. HEALTH RECORDS
-- ============================================================================

INSERT INTO health_records (health_record_id, user_id, academy_id, blood_type, weight_kg, height_cm, hypertension, diabetes, cardiac, labyrinthitis, asthma_bronchitis, epilepsy_seizures, stress_depression, created_at)
VALUES
  ('750e8400-e29b-41d4-a716-446655440051'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'O+', 65.5, 172, false, false, false, false, false, false, false, NOW()),
  ('750e8400-e29b-41d4-a716-446655440052'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'A+', 72.0, 178, false, false, false, false, true, false, false, NOW()),
  ('750e8400-e29b-41d4-a716-446655440053'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'B-', 68.3, 175, false, false, false, false, false, false, false, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. JUDO PROFILES
-- ============================================================================

INSERT INTO judo_profile (judo_profile_id, student_id, academy_id, is_federated, federation_registration, current_belt, belt_date, created_at)
VALUES
  ('850e8400-e29b-41d4-a716-446655440051'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, true, 'CBJ-2025-001564', 'Faixa Branca', '2025-01-20'::date, NOW()),
  ('850e8400-e29b-41d4-a716-446655440052'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, true, 'CBJ-2025-001565', 'Faixa Branca Cós Amarela', '2024-09-15'::date, NOW()),
  ('850e8400-e29b-41d4-a716-446655440053'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, false, NULL, 'Faixa Amarela', '2024-03-10'::date, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. JUDO BELT HISTORY (Audit Trail)
-- ============================================================================

INSERT INTO judo_belt_history (belt_history_id, student_id, academy_id, belt, received_date, promoted_by_user_id, notes, created_at)
VALUES
  -- Bruno Silva (aluno1) - 2 belt progressions
  ('950e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Faixa Branca', '2025-01-20'::date, '650e8400-e29b-41d4-a716-446655440011'::uuid, 'Início no judo', NOW()),
  
  -- Lucas Oliveira (aluno2) - 3 belt progressions
  ('950e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Faixa Branca', '2024-09-15'::date, '650e8400-e29b-41d4-a716-446655440011'::uuid, 'Inscrição inicial', NOW()),
  ('950e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Faixa Branca Cós Amarela', '2024-12-01'::date, '650e8400-e29b-41d4-a716-446655440012'::uuid, 'Progresso notável em técnicas', NOW()),
  
  -- Rafael Costa (aluno3) - 4 belt progressions
  ('950e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Faixa Branca', '2024-03-10'::date, '650e8400-e29b-41d4-a716-446655440013'::uuid, 'Transferência de outra academia', NOW()),
  ('950e8400-e29b-41d4-a716-446655440005'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Faixa Branca Cós Amarela', '2024-06-22'::date, '650e8400-e29b-41d4-a716-446655440011'::uuid, 'Dedicação constante', NOW()),
  ('950e8400-e29b-41d4-a716-446655440006'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Faixa Amarela', '2024-11-15'::date, '650e8400-e29b-41d4-a716-446655440012'::uuid, 'Demonstrou domínio das técnicas', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. STUDENT-GUARDIAN LINKS
-- ============================================================================

INSERT INTO student_guardians (student_guardian_id, academy_id, student_id, guardian_id, relationship, is_primary)
VALUES
  ('a50e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '650e8400-e29b-41d4-a716-446655440031'::uuid, 'Mãe', true),
  ('a50e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '650e8400-e29b-41d4-a716-446655440031'::uuid, 'Pai', true),
  ('a50e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '650e8400-e29b-41d4-a716-446655440032'::uuid, 'Mãe', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. TURMAS (Classes)
-- ============================================================================

INSERT INTO turmas (turma_id, academy_id, professor_id, name, description, capacity, is_active, created_at)
VALUES
  ('b50e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid, 'Iniciantes - Manhã', 'Turma para iniciantes (crianças 8-10 anos)', 20, true, NOW()),
  ('b50e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid, 'Intermediários - Tarde', 'Turma para alunos com experiência (faixas amarela+)', 25, true, NOW()),
  ('b50e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440013'::uuid, 'Adultos - Noite', 'Turma para adultos (maiores de 18)', 15, true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. ENROLLMENTS (Turma-Student Links)
-- ============================================================================

INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
VALUES
  ('c50e8400-e29b-41d4-a716-446655440001'::uuid, 'b50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'active', NOW()),
  ('c50e8400-e29b-41d4-a716-446655440002'::uuid, 'b50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440054'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'active', NOW()),
  ('c50e8400-e29b-41d4-a716-446655440003'::uuid, 'b50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'active', NOW()),
  ('c50e8400-e29b-41d4-a716-446655440004'::uuid, 'b50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'active', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. TRAINING SESSIONS
-- ============================================================================

INSERT INTO training_sessions (session_id, turma_id, professor_id, academy_id, session_date, session_time, duration_minutes, notes, created_at)
VALUES
  ('d50e8400-e29b-41d4-a716-446655440001'::uuid, 'b50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 7, '09:00', 60, 'Aquecimento + Técnicas básicas', NOW()),
  ('d50e8400-e29b-41d4-a716-446655440002'::uuid, 'b50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 5, '09:00', 60, 'Revisão de queda segura', NOW()),
  ('d50e8400-e29b-41d4-a716-446655440003'::uuid, 'b50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 6, '15:00', 75, 'Treino de defesa e contra-ataques', NOW()),
  ('d50e8400-e29b-41d4-a716-446655440004'::uuid, 'b50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 3, '15:00', 75, 'Simulação de combate (randori)', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. TECHNIQUES
-- ============================================================================

INSERT INTO techniques (technique_id, academy_id, name, description, category, is_favorite, created_at)
VALUES
  ('e50e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'O Goshi', 'Projeção de quadril', 'Técnicas de Pé', true, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Seoi Nage', 'Projeção pelas costas', 'Técnicas de Pé', true, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Osoto Gari', 'Apreensão da perna por fora', 'Técnicas de Pé', true, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Armlock (Uchi Mata)', 'Técnica de estrangulamento de braço', 'Técnicas de Solo', false, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Queda Segura', 'Queda básica em segurança', 'Queda Segura', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. SESSION TECHNIQUES
-- ============================================================================

INSERT INTO session_techniques (session_technique_id, session_id, technique_id, academy_id, technique_order, created_at)
VALUES
  ('f50e8400-e29b-41d4-a716-446655440001'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'e50e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 1, NOW()),
  ('f50e8400-e29b-41d4-a716-446655440002'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'e50e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 2, NOW()),
  ('f50e8400-e29b-41d4-a716-446655440003'::uuid, 'd50e8400-e29b-41d4-a716-446655440002'::uuid, 'e50e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 1, NOW()),
  ('f50e8400-e29b-41d4-a716-446655440004'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, 'e50e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 1, NOW()),
  ('f50e8400-e29b-41d4-a716-446655440005'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, 'e50e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 2, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. SESSION ATTENDANCE
-- ============================================================================

INSERT INTO session_attendance (attendance_id, session_id, student_id, academy_id, status, marked_by_user_id, created_at)
VALUES
  ('150e8400-e29b-41d4-a716-446655440001'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'present', '650e8400-e29b-41d4-a716-446655440011'::uuid, NOW()),
  ('150e8400-e29b-41d4-a716-446655440002'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440054'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'present', '650e8400-e29b-41d4-a716-446655440011'::uuid, NOW()),
  ('150e8400-e29b-41d4-a716-446655440003'::uuid, 'd50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'justified', '650e8400-e29b-41d4-a716-446655440011'::uuid, NOW()),
  ('150e8400-e29b-41d4-a716-446655440004'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'present', '650e8400-e29b-41d4-a716-446655440012'::uuid, NOW()),
  ('150e8400-e29b-41d4-a716-446655440005'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'present', '650e8400-e29b-41d4-a716-446655440012'::uuid, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. SESSION COMMENTS
-- ============================================================================

INSERT INTO session_comments (comment_id, session_id, student_id, professor_id, academy_id, content, sentiment, created_at)
VALUES
  ('250e8400-e29b-41d4-a716-446655440001'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ótimo desempenho na queda segura. Mantém a técnica correta.', 'positive', NOW()),
  ('250e8400-e29b-41d4-a716-446655440002'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440054'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Melhorando a postura. Precisa de mais prática com o O Goshi.', 'neutral', NOW()),
  ('250e8400-e29b-41d4-a716-446655440003'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Excelente evolução em defesa. Pronto para ranking.', 'positive', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. STUDENT PROGRESS
-- ============================================================================

INSERT INTO student_progress (progress_id, student_id, academy_id, total_sessions, total_attendance, total_attendance_percentage, streak_current, streak_longest, badges_earned_count, created_at)
VALUES
  ('350e8400-e29b-41d4-a716-446655440051'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 12, 11, 91.67, 5, 8, 2, NOW()),
  ('350e8400-e29b-41d4-a716-446655440052'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 18, 16, 88.89, 3, 10, 3, NOW()),
  ('350e8400-e29b-41d4-a716-446655440053'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 25, 24, 96.00, 8, 12, 5, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. BADGES
-- ============================================================================

INSERT INTO badges (badge_id, academy_id, name, description, criteria_type, criteria_value, created_at)
VALUES
  ('450e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '🔥 Sequência de Fogo', 'Participou de 10 aulas consecutivas sem faltas', 'streak', 10, NOW()),
  ('450e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '⭐ Dedicado', 'Frequência de 90% ou mais', 'attendance_percentage', 90, NOW()),
  ('450e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '🏆 Milestone 20', 'Completou 20 aulas', 'sessions_total', 20, NOW()),
  ('450e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '🎯 Iniciante', 'Completou primeira aula', 'milestone', 1, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. STUDENT BADGES (Earned)
-- ============================================================================

INSERT INTO student_badges (earned_id, badge_id, student_id, academy_id, earned_at, notified_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440051'::uuid, '450e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 10, CURRENT_DATE - 10),
  ('550e8400-e29b-41d4-a716-446655440052'::uuid, '450e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 5, CURRENT_DATE - 5),
  ('550e8400-e29b-41d4-a716-446655440053'::uuid, '450e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 2, CURRENT_DATE - 2),
  ('550e8400-e29b-41d4-a716-446655440054'::uuid, '450e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE - 1, CURRENT_DATE - 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
-- Total records inserted:
-- Academies: 3
-- Users: 15 (1 admin + 3 professors + 3 guardians + 5 students + 1 other academy admin)
-- Health Records: 3
-- Judo Profiles: 3
-- Judo Belt History: 7
-- Student-Guardian Links: 3
-- Turmas: 3
-- Enrollments: 4
-- Training Sessions: 4
-- Techniques: 5
-- Session Techniques: 5
-- Session Attendance: 5
-- Session Comments: 3
-- Student Progress: 3
-- Badges: 4
-- Student Badges: 4
