-- Migration: V6_1__training_turmas_schedule_json.sql
-- Purpose: Ensure turmas.schedule_json exists for training entry-point and turma management flows.

ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS schedule_json JSONB;
