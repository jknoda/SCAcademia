-- Flyway Migration: V6_0__Sync_Queue.sql
-- Phase 6: Offline Synchronization Queue
-- Tables: sync_queue (offline operations queue), audit for sync batches
-- Dependencies: V1 (users, academies), V3 (training_sessions)
-- Status: Independent, reversible
-- Purpose: Support offline-first features with automatic sync and conflict resolution

-- `sync_queue` — Offline Operations Queue
-- Stores operations that were performed offline and need to be synced to server
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  batch_id UUID NOT NULL, -- Groups multiple operations from same offline session
  action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
  resource VARCHAR(50) NOT NULL, -- 'training', 'training_attendance', 'technique'
  resource_id UUID, -- ID of the resource being modified (FK to training_sessions, etc.)
  payload JSONB NOT NULL, -- Full operation payload
  client_timestamp BIGINT NOT NULL, -- Milliseconds since epoch (client-side)
  server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When server received it
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'retry'
  retry_count INT DEFAULT 0, -- Number of failed attempts
  max_retries INT DEFAULT 5,
  error_message TEXT, -- Last error if failed
  next_retry TIMESTAMP, -- When to retry next (for backoff)
  resolved_with VARCHAR(20), -- How conflict was resolved: 'server_version', 'client_version', null
  conflict_detected BOOLEAN DEFAULT false,
  server_version JSONB, -- Server's version if conflict detected (for client reconciliation)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP, -- When this record was successfully synced
  deleted_at TIMESTAMP, -- Soft delete for audit trail

  CONSTRAINT action_valid CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'synced', 'failed', 'retry')),
  CONSTRAINT payload_not_empty CHECK (payload IS NOT NULL AND payload != 'null'::jsonb)
);

-- Indexes for common queries
CREATE INDEX idx_sync_queue_professor ON sync_queue(professor_id, academy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sync_queue_status ON sync_queue(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sync_queue_batch ON sync_queue(batch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sync_queue_pending ON sync_queue(next_retry, retry_count) WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX idx_sync_queue_failed ON sync_queue(status) WHERE status = 'failed' AND deleted_at IS NULL;
CREATE INDEX idx_sync_queue_created_at ON sync_queue(professor_id, created_at DESC) WHERE deleted_at IS NULL;

-- `sync_history` — Archive of completed syncs
-- Cleaned up after 30 days but kept for audit trail
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  batch_id UUID NOT NULL,
  sync_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_records INT NOT NULL, -- How many operations synced
  synced_count INT NOT NULL, -- How many succeeded
  failed_count INT NOT NULL, -- How many failed
  conflict_count INT NOT NULL, -- How many had conflicts
  duration_ms INT, -- How long sync took
  error_summary TEXT, -- If failures occurred, summary of errors
  client_version VARCHAR(20), -- Client app version at time of sync
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP

  CONSTRAINT counts_valid CHECK (synced_count >= 0 AND failed_count >= 0 AND conflict_count >= 0)
);

CREATE INDEX idx_sync_history_professor ON sync_history(professor_id, academy_id);
CREATE INDEX idx_sync_history_batch ON sync_history(batch_id);
CREATE INDEX idx_sync_history_created_at ON sync_history(created_at DESC);

-- Cleanup: Remove sync_history older than 30 days (run periodically)
-- DELETE FROM sync_history WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
