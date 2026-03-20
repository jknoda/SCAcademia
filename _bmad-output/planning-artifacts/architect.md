---
date: 2026-03-19
project: SCAcademia
author: Noda
type: Technical Architecture Plan
status: Ready for Development
version: 1.0-Draft
---

# Technical Architecture Plan
## SCAcademia - Judo Academy Management System

---

## Executive Summary

This document outlines the technical architecture for SCAcademia MVP, a web-based judo academy management system built with **Angular SPA + Node.js REST API + PostgreSQL**.

**Architecture Philosophy:**
- Layered SPA architecture (industry standard)
- LGPD-first security model (data protection from day 1)
- Stateless backend (horizontal scaling ready)
- Domain-driven service design (not generic CRUD)
- Offline-first mobile experience (IndexedDB + auto-sync)

**Critical Success Factors:**
1. ✅ LGPD compliance (audit logs, data encryption, user consent)
2. ✅ RBAC with data isolation (professor sees only their students)
3. ✅ Performance targets (<1s graphs, <2s registration)
4. ✅ Offline-first (professor can register without connection)
5. ✅ Type safety (TypeScript frontend + backend)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram

┌──────────────────────────────────────────────────────────┐
│ CLIENT LAYER │
│ ┌──────────────────────────────────────────────────────┐
│ │ Angular SPA (TypeScript) │
│ │ • Dashboard Module (lazy-loaded) │
│ │ • Training Module (lazy-loaded) │
│ │ • Performance Module (with charts) │
│ │ • Health/Consent Module │
│ │ • Admin Module │
│ │ │
│ │ State Management: NgRx (effects + reducers) │
│ │ Offline Cache: IndexedDB (localStorage fallback) │
│ │ Routing: Lazy Loading + Auth Guards │
│ └──────────────────────────────────────────────────────┘
└────────────────────┬─────────────────────────────────────┘
│
HTTPS/TLS 1.2+ + JWT Headers
│
┌────────────────────▼─────────────────────────────────────┐
│ API GATEWAY LAYER (Node.js) │
│ ┌──────────────────────────────────────────────────────┐
│ │ Express.js + TypeScript │
│ │ • Auth Middleware (JWT validation) │
│ │ • RBAC Middleware (role check) │
│ │ • Request Validation (Joi/Zod) │
│ │ • Rate Limiting (100 req/min per user) │
│ │ • Request Logging Middleware (audit) │
│ │ • Error Handling (structured errors) │
│ │ • CORS Configuration (enforce origin) │
│ │ • Request Sanitization (XSS prevention) │
│ └──────────────────────────────────────────────────────┘
└────────────────────┬─────────────────────────────────────┘
│
JSON-RPC
│
┌────────────────────▼─────────────────────────────────────┐
│ BUSINESS LOGIC LAYER (Node.js Services) │
│ ┌──────────────────────────────────────────────────────┐
│ │ • UserService (Auth, RBAC, consent management) │
│ │ • TrainingService (registro, histórico) │
│ │ • PerformanceService (gráficos, evolução) │
│ │ • HealthLgpdService (anamnese, conformidade) │
│ │ • AuditService (append-only logging) │
│ │ • SyncService (offline conflict resolution) │
│ │ • NotificationService (email, in-app) │
│ └──────────────────────────────────────────────────────┘
└────────────────────┬─────────────────────────────────────┘
│
ORM Layer (TypeORM)
│
┌────────────────────▼─────────────────────────────────────┐
│ DATA LAYER (PostgreSQL + pgcrypto) │
│ ┌──────────────────────────────────────────────────────┐
│ │ RBAC Tables: │
│ │ users, roles, permissions, user_roles │
│ │ role_permissions, consents │
│ │ │
│ │ Domain Tables: │
│ │ academies, students, teachers, classes │
│ │ trainings, training_attendance, performance_notes │
│ │ │
│ │ Health/Compliance: │
│ │ health_history, allergies, restrictions │
│ │ code_of_conduct_acceptance, image_consent │
│ │ │
│ │ Audit/System: │
│ │ audit_logs (append-only, immutable) │
│ │ sync_queue (offline sync resolution) │
│ │ deleted_records (soft delete tracking) │
│ │ │
│ │ Encryption: pgcrypto (AES-256) for sensitive data │
│ └──────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────┘


---

### 1.2 Deployment Architecture

┌─────────────────────────────────────────────────────────┐
│ CLOUD DEPLOYMENT (AWS/GCP/DO) │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ CDN (CloudFront / Cloudflare) │ │
│ │ • Static assets cache (CSS, JS, images) │ │
│ │ • Geographic distribution │ │
│ │ • TLS certificate management │ │
│ └────────────────────────────────────────────────────┘ │
│ ↓ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Load Balancer (ALB / Cloud Load Balancer) │ │
│ │ • HTTPS termination │ │
│ │ • Route distribution │ │
│ │ • Health checks │ │
│ └────────────────────────────────────────────────────┘ │
│ ↓ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ API Servers (Container/Kubernetes) │ │
│ │ • 2-3 Node.js / Express instances (Phase 1 MVP) │ │
│ │ • Auto-scaling based on CPU (Phase 2+) │ │
│ │ • Container orchestration (Docker) │ │
│ └────────────────────────────────────────────────────┘ │
│ ↓ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Database (RDS / Cloud SQL) │ │
│ │ • PostgreSQL 13+ │ │
│ │ • Automated backups (daily, 30-day retention) │ │
│ │ • Multi-AZ for HA (Phase 2+) │ │
│ │ • Read replicas for reporting (Phase 2+) │ │
│ └────────────────────────────────────────────────────┘ │
│ ↓ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Cache Layer (Redis) │ │
│ │ • Session tokens (2h TTL) │ │
│ │ • Graph aggregations (1h TTL) │ │
│ │ • Rate limiting counters │ │
│ └────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Monitoring & Logging │ │
│ │ • Logs: CloudWatch / Stackdriver │ │
│ │ • Metrics: Prometheus + Grafana │ │
│ │ • Errors: Sentry / Rollbar │ │
│ │ • Uptime: PagerDuty / OpsGenie │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘


---

## 2. Technology Stack Rationale

### 2.1 Frontend: Angular SPA

**Why Angular?**
- Enterprise-grade framework (mature, stable)
- Strong typing (TypeScript mandatory)
- Built-in dependency injection (clean architecture)
- RxJS for reactive async operations
- Powerful CLI for build optimization

**Key Patterns:**
- Feature modules (lazy-loaded for performance)
- Smart/Dumb component pattern
- Guards for auth/permissions
- Interceptors for centralized API handling

**State Management: NgRx**
- Single source of truth for app state
- Time-travel debugging
- Testable effects (side effects isolation)
- Works well with Redux DevTools

**Offline Support:**
- IndexedDB for persistent storage (50MB+)
- Service Worker for offline-first experience
- Automatic sync queue when reconnected

### 2.2 Backend: Node.js + Express

**Why Node.js?**
- JavaScript everywhere (FE + BE same language)
- Async-first (non-blocking I/O)
- Large ecosystem (npm packages)
- Lightweight + fast startup

**Framework: Express + TypeScript**
- Minimalist, flexible routing
- Middleware pattern (perfect for LGPD/audit layers)
- Strong typing with TypeScript
- Mature ecosystem

**Key Libraries:**
- **TypeORM**: Type-safe ORM with PostgreSQL support
- **Joi/Zod**: Schema validation (protect against malformed data)
- **jsonwebtoken**: JWT encoding/decoding
- **bcryptjs**: Password hashing
- **rate-limiter-flexible**: Rate limiting
- **winston**: Structured logging (audit logs)
- **helmet**: Security headers

### 2.3 Database: PostgreSQL

**Why PostgreSQL?**
- ACID transactions (data integrity)
- Strong typing (CHECK constraints, domains)
- Full-text search (future phase reports)
- Encryption extensions (pgcrypto)
- JSONB support (flexible schema evolution)
- Proven track record in fintech/healthcare

**Key Constraints:**
- Row-level security (RLS) for RBAC (Phase 2 optimization)
- Partitioning for large audit logs (Phase 3)
- Foreign keys (referential integrity)
- Indexes on frequently accessed columns (performance)

---

## 3. Security & LGPD Architecture

### 3.1 Authentication & Authorization

**Authentication Flow:**

User logs in with email + password
↓
Backend verifies credentials (bcrypt comparison)
↓
Backend issues JWT tokens:
access_token (15-60 min expiry)
refresh_token (7 days expiry)
↓
Client stores tokens in:
access: Memory (cleared on logout)
refresh: Secure httpOnly cookie (CSRF protected)
↓
Client includes JWT in Authorization header on all requests
↓
Server validates JWT signature on each request
If expired: return 401, client uses refresh token
If invalid: return 401, force re-login
↓
On logout: invalidate tokens + clear cookies


**Implementation Details:**
- **Password**: Minimum 8 chars, uppercase + number + special char
- **Hashing**: bcryptjs (10 salt rounds)
- **JWT Secret**: Rotate every 90 days (env var)
- **Refresh Token Rotation**: Issue new pair on each refresh (prevent token replay)

### 3.2 Role-Based Access Control (RBAC)

**4 Roles with Strict Data Isolation:**

| Role | Permissions | Data Access | Notes |
|------|------------|-------------|-------|
| **Admin** | All system actions | Own academy only | Can't edit health data of minors |
| **Professor** | Register training, add notes | Only own turmas/students | Can't see students from other professors |
| **Aluno** | View own progress | Own data only | Can view health data (their own) |
| **Responsável** | View child progress, reports | Only child's data | Can't edit health data |

**Implementation: Query-Level Filtering**

```typescript
// Example: Professor retrieves students
queryBuilder
  .select('student')
  .from(Student, 'student')
  .innerJoin('student.classes', 'class')
  .innerJoin('class.professor', 'professor')
  .where('professor.id = :professorId', { professorId: req.user.id })
  // Prevents professor from seeing students of other professors

  No God Admin: Even Admin can't bypass data isolation without audit trail.

3.3 LGPD Compliance Architecture
Requirement 1: Consentimento Explícito (Minors)

Workflow:
  1. Admin adds student < 18
  2. Send email to parent/responsável with consent link
  3. Parent clicks link → login → consent form (3-step)
     - Health: "I confirm child can provide health data"
     - Ethics: "I accept code of conduct"
     - Privacy: "I authorize photos/videos for reports | social | none"
  4. Parent signs digitally (checkbox + timestamp)
  5. System stores consent with version tracking
  6. Can't use student data until consent signed

  CREATE TABLE consents (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  responsible_id UUID NOT NULL REFERENCES users(id),
  consent_type ENUM ('health', 'ethics', 'privacy'),
  accepted BOOLEAN,
  accepted_at TIMESTAMP,
  version INT,
  ip_address INET,
  user_agent TEXT,
  -- For audit
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

Requirement 2: Direito ao Esquecimento (Right to Delete)

Workflow:
  1. Parent/Admin requests deletion of minor's data
  2. System initiates 30-day grace period (notify admin)
  3. After 30 days: cascade DELETE on:
     - students (soft_delete = true, mask PII)
     - trainings attendance records (anonymize)
     - performance notes (clear text, keep aggregate)
     - health history (DELETE hard, no mask needed per LGPD)
  4. Audit logs preserved (regulatory requirement)
  5. Backup retention policy: 90 days (legal hold)

Implementation: Soft Delete Pattern

CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  soft_delete BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  -- Audit
  created_at TIMESTAMP DEFAULT now()
);

-- Query always filters soft_delete = false
-- Exception: Analytics queries include deleted count

Requirement 3: Data Minimization

Only collect data necessary for each use case:

✅ Student health: allergies, restrictions, emergency contact
❌ Student health: medical history (defer to parent consultation)
✅ Training attendance: date, duration, presence
❌ Training attendance: GPS location, biometric data
3.4 Encryption Architecture
Data in Transit:

HTTPS 1.2+ TLS (no HTTP)
Certificate rotation (Let's Encrypt 90-day auto-renewal)
Enforce HSTS (HTTP Strict Transport Security) header
Data at Rest:

Sensitive columns encrypted with pgcrypto (AES-256):
health_history.allergies
health_history.restrictions
students.emergency_contact (phone)
users.email (for PII protection)
consents.data_json (full consent content)
Secrets Management:

Environment variables (never commit to git)
Rotation policy: every 90 days
Development: use .env (file), never commit
Production: use managed secrets (AWS Secrets Manager, GCP Secret Manager)
3.5 Audit Logging (Immutable)
Audit Log Structure:

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50), -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
  resource_type VARCHAR(50), -- 'student', 'training', 'consent'
  resource_id UUID,
  resource_snapshot JSONB, -- Before state (for DELETE)
  new_snapshot JSONB, -- After state
  changes JSONB, -- {field: {old, new}}
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
  -- NO UPDATE/DELETE allowed on this table (view-only)
);

-- Trigger for auto-logging
CREATE TRIGGER audit_trigger AFTER INSERT, UPDATE, DELETE ON trainings
FOR EACH ROW EXECUTE FUNCTION log_audit();


Log Retention Policy:

MVP: 12 months (regulatory minimum for LGPD)
Phase 2: Archive to S3 (8 years for audit compliance)
4. Performance Architecture
4.1 Frontend Performance
Goal: <3s Initial Load, <1s Interactions

Optimization Strategies:

Code Splitting (Lazy Loading)

app/
  → shared/          (global: 50KB)
  → dashboard/       (lazy: 80KB, loads on route)
  → training/        (lazy: 120KB, loads on route)
  → performance/     (lazy: 150KB with charts library)

Bundle Optimization

Tree-shaking unused code
Minification + gzip
Polyfills loaded conditionally
Extract vendor libs to separate bundle
Caching Strategy

Workbox service worker (offline + cache-first for assets)
Browser cache headers (1 year for versioned assets)
API responses cached in IndexedDB (1h TTL)
Chart Performance

Pre-aggregate data in backend (don't send raw data)
Example: Chart needs 12 months of data
Backend: aggregate to 12 points (1 per month)
Frontend: chart renders in <1s (12 points vs 500 points)
Frontend Metrics (Lighthouse):

LCP (Largest Contentful Paint): <2.5s
FID (First Input Delay): <100ms
CLS (Cumulative Layout Shift): <0.1
Performance Score: >90
4.2 Backend Performance
Goal: API response <200ms (95th percentile)

Optimization Strategies:

N+1 Query Prevention
// ❌ Bad: N+1 queries
const trainings = await TrainingRepo.find();
trainings.forEach(t => {
  t.students = await StudentRepo.find({ training: t.id }); // Loop!
});

// ✅ Good: Single query with JOIN
const trainings = await TrainingRepo.find({
  relations: ['students', 'professor']
});

Database Indexes

CREATE INDEX idx_trainings_professor_id ON trainings(professor_id);
CREATE INDEX idx_training_attendance_training_id ON training_attendance(training_id);
CREATE INDEX idx_students_academy_id ON students(academy_id);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_type, resource_id, created_at);

Query Result Caching (Redis)

// Cache graph data (expensive aggregation)
const cacheKey = `student:${studentId}:progress:${month}`;
let progress = await redis.get(cacheKey);

if (!progress) {
  progress = await expensiveAggregation(studentId, month);
  await redis.setex(cacheKey, 3600, JSON.stringify(progress)); // 1h TTL
}

Pagination for Large Datasets

GET /api/trainings?limit=20&offset=0
Returns: { data: [...], total: 523, hasMore: true }


Connection Pooling (Database)

TypeORM default pool: 10 connections
Adjust based on concurrent users (50+ for MVP)
Monitor: active connections / pool size ratio
4.3 Database Performance
Slow Query Monitoring:

-- Enable slow query log (queries > 200ms)
SET log_min_duration_statement = 200; -- milliseconds

-- Monitor active queries
SELECT pid, usename, state, query FROM pg_stat_activity WHERE state != 'idle';

Vacuuming & Maintenance:

Autovacuum enabled (default)
Index bloat monitoring (Phase 2)
Analyze table statistics regularly
5. Offline & Sync Architecture
5.1 Offline-First Pattern
Goal: Professor can register training without connection

Flow:

1. Professor opens app (online)
   → All data cached in IndexedDB

2. WiFi drops (offline)
   → App detects offline state
   → "Registration available offline" banner

3. Professor registers training
   → Data saved to IndexedDB (sync_queue table)
   → UI shows: "Saved locally, will sync when online"

4. WiFi returns (online)
   → App detects connection
   → Start sync: upload IndexedDB queue to server

5. Server processes sync:
   → Validate training (business logic)
   → Check for conflicts (same training edited locally + server)
   → Apply Last-Write-Wins (LWW): newer timestamp wins
   → Save to database
   → Return sync confirmation

6. Client receives confirmation
   → Remove from sync queue
   → Update local cache
   → UI shows: "Synced ✓"

   IndexedDB Schema:

// Sync Queue Table
{
  id: '123',
  action: 'CREATE', // or UPDATE, DELETE
  resource: 'training',
  resourceId: 'training-456',
  payload: { /* training data */ },
  timestamp: 1710854400000,
  localTimestamp: 1710854350000,
  status: 'pending', // or 'synced', 'conflict'
  conflictResolution: null // or 'last-write-wins', 'manual'
}

5.2 Conflict Resolution
Last-Write-Wins (LWW) Strategy:

Scenario: Professor edits training both offline (local) and admin edits server

Local: training.notes = "Updated locally at 10:00"
Server: training.notes = "Updated by admin at 10:05"

Resolution:
  → Server timestamp 10:05 > Local timestamp 10:00
  → Server wins (admin's edit preserved)
  → Client receives new data, overwrites local
  → User sees: "Conflict resolved: server version applied"

  Fallback: Manual Resolution (Phase 2+)

For critical conflicts (both edited same field)
Present user with: "Local | Share | Server" options
User chooses version to keep
6. Detailed Component Specifications
6.1 UserService (Authentication & RBAC)
Responsibilities:

Register, login, logout users
Manage JWT tokens (issue, refresh, revoke)
Maintain session state
RBAC permission checking
Consent management for minors
Key Methods:

class UserService {
  async register(email, password, role): Promise<User>
  async login(email, password): Promise<{accessToken, refreshToken}>
  async refreshToken(refreshToken): Promise<{accessToken, refreshToken}>
  async logout(userId): Promise<void>
  
  async hasPermission(userId, action, resource): Promise<boolean>
  async createConsent(studentId, consentData): Promise<Consent>
  async validateConsentBeforeAction(studentId, action): Promise<boolean>
}

6.2 TrainingService
Responsibilities:

Register training (quick <2s)
Record attendance (present / absent)
Store performance notes
Retrieve training history
Key Methods:

class TrainingService {
  async createTraining(trainingData): Promise<Training>
  async recordAttendance(trainingId, attendanceData): Promise<TrainingAttendance>
  async addPerformanceNote(trainingId, studentId, note): Promise<Note>
  
  async getTrainingHistory(studentId, limit=20): Promise<Training[]>
  async getClassTrainings(classId, startDate, endDate): Promise<Training[]>
}

Performance Note: Aggregate attendance counts in database, don't fetch all records every time.

6.3 PerformanceService
Responsibilities:

Calculate performance metrics
Generate graph data (participation, evolution scores)
Return aggregated data for visualization
Key Methods:

class PerformanceService {
  async getParticipationGraph(studentId, months=12): Promise<GraphData>
  // Returns: [{month: 'Jan', trainings: 8}, ..., {month: 'Dec', trainings: 11}]
  
  async getEvolutionScore(studentId): Promise<EvolutionMetric>
  // Returns aggregated performance trend
  
  async getMilestones(studentId): Promise<Milestone[]>
  // Returns: [{date: '2026-02-15', event: 'Passou de faixa para Laranja'}, ...]
}

6.4 HealthLgpdService
Responsibilities:

Manage health records (anamnese, allergies, restrictions)
Enforce consent requirements
Support LGPD deletion requests
Key Methods:

class HealthLgpdService {
  async createHealthRecord(studentId, healthData): Promise<HealthRecord>
  // Enforces: consent must exist before creating health data
  
  async updateHealthRecord(studentId, updates): Promise<HealthRecord>
  // Enforces: only parent (responsável) can update for minors
  
  async requestDataDeletion(studentId): Promise<DeletionRequest>
  // Initiates 30-day grace period, then soft-deletes
  
  async getStudentPublicData(studentId): Promise<PublicData>
  // Returns only non-sensitive data (name, faixa, progress)
}

6.5 AuditService
Responsibilities:

Log all data-access events
Prevent audit log tampering
Support audit queries for compliance
Key Methods:

class AuditService {
  async logAction(
    actorId, action, resourceType, resourceId, 
    beforeState, afterState, ipAddress, userAgent
  ): Promise<AuditLog>
  
  async getAuditTrail(
    resourceType, resourceId, startDate, endDate
  ): Promise<AuditLog[]>
  // Returns who accessed what, when, and what they changed
  
  async getAccessHistory(userId, startDate, endDate): Promise<AuditLog[]>
  // For compliance reports: "What did this user access?"
}

7. API Contract Specification
7.1 REST Endpoints (MVP Scope)
Authentication:

POST   /api/auth/register          → Register user
POST   /api/auth/login             → Login, get tokens
POST   /api/auth/refresh           → Refresh access token
POST   /api/auth/logout            → Logout
GET    /api/auth/me                → Current user info

Students

GET    /api/students?limit=20      → List (filtered by role)
POST   /api/students               → Create student
GET    /api/students/:id           → Get student details
PUT    /api/students/:id           → Update student (RBAC check)
DELETE /api/students/:id           → Soft delete student

Trainings

GET    /api/trainings?classId=X    → Get trainings for class
POST   /api/trainings              → Create training (<5 min)
GET    /api/trainings/:id          → Get training + attendance
POST   /api/trainings/:id/attendance → Record attendance
PUT    /api/trainings/:id/notes/:studentId → Add performance note

Performance

GET    /api/students/:id/progress/participation  → Frequency graph data
GET    /api/students/:id/progress/evolution      → Evolution score
GET    /api/students/:id/milestones              → Milestone timeline

Health/LGPD:

POST   /api/health/:studentId      → Create health record
GET    /api/health/:studentId      → Get health record
POST   /api/consents               → Submit consent form
GET    /api/consents/:studentId    → Get consent status
POST   /api/requests/deletion      → Request data deletion

Admin:

GET    /api/admin/dashboard        → System metrics
GET    /api/admin/audit-logs?filter → Audit trail for compliance

7.2 Error Response Format

{
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student with ID 'abc123' not found",
    "statusCode": 404,
    "timestamp": "2026-03-19T10:30:00Z",
    "requestId": "req-12345" // For support debugging
  }
}

8. Infrastructure & DevOps
8.1 Development Environment
Local Setup:

# Clone repo
git clone https://github.com/youracademy/scacademia.git
cd scacademia

# Install dependencies
npm install
cd client && npm install && cd ..

# Setup env files
cp .env.example .env
cp client/.env.example client/.env

# Start database
docker-compose up -d postgres redis

# Start dev servers
npm run dev:backend  # Node.js on :3000
npm run dev:frontend  # Angular on :4200

# Run tests
npm run test
npm run test:e2e

8.2 Continuous Integration (CI)
GitHub Actions Pipeline:

name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Lint
        run: npm run lint
      - name: Unit tests
        run: npm run test
      - name: Build
        run: npm run build
      - name: E2E tests (critical paths)
        run: npm run test:e2e

8.3 Continuous Deployment (CD)
Deployment Pipeline:        

main branch → GitHub Actions
  ↓
All tests pass + lint OK
  ↓
Build Docker image
  ↓
Push to registry (ECR / GCR)
  ↓
Deploy to staging
  ↓
Smoke tests (health checks, critical paths)
  ↓
Manual approval for production
  ↓
Deploy to production (rolling update)
  ↓
Monitor error rates + performance

8.4 Monitoring & Alerting
Key Metrics to Monitor:

Metric	Target	Alert Threshold
API Response Time (p95)	<200ms	>400ms
Database Query Time (p95)	<100ms	>200ms
Error Rate	<0.1%	>1%
CPU Usage	<60%	>80%
Memory Usage	<70%	>85%
Disk Usage (DB)	<80%	>90%
Uptime	99%	<99%
Dashboards:

Operations Dashboard: API latency, error rates, uptime
Business Dashboard: Active users, trainings registered/day, adoption rate
Compliance Dashboard: LGPD audit log volume, consent status, data deletions
9. Implementation Roadmap
Phase 1 (Meses 1-4): MVP Launch
Sprint 1-2: Foundation (2 weeks)

 Database schema (users, students, trainings, health, audit)
 Auth system (JWT, password hashing)
 RBAC middleware + permission checks
 Angular project setup (modules, routing)
Sprint 3-4: Core Features (2 weeks)

 Training registration API + UI
 Attendance tracking
 Performance notes
 Basic graphs (participation, notes history)
Sprint 5: Health & Compliance (1 week)

 Anamnese form + storage
 Consent workflow (email + form)
 Audit logging setup
 LGPD compliance checklist
Sprint 6: Polish & Testing (1 week)

 Fix bugs + performance
 E2E tests (critical workflows)
 Security review + penetration testing
 Docker + deployment setup
Sprint 7: Quality & Launch (1 week)

 Load testing (50+ concurrent users)
 Backup / restore testing
 Production deployment (staging → prod)
 Launch communication to academies
Phase 2 (Meses 5-7): Growth & Adoption
Responsável dashboard + reports
Score 1-10 evolution metric
Email notifications
Performance optimization (caching, indexing)
Phase 3 (Meses 8-12): Advanced Features
IA/Insights (churn prediction, performance trends)
Multi-tenancy architecture prep
App mobile scaffolding
API for third-party integrations
10. Architecture Decision Records (ADRs)
ADR-001: Why PostgreSQL instead of MongoDB?
Decision: Use PostgreSQL (relational) instead of MongoDB (document).

Rationale:

✅ ACID transactions (critical for financial accuracy)
✅ Strong typing via schema (validation layer)
✅ Powerful JOIN operations (reporting queries)
✅ Encryption at field level (pgcrypto for LGPD)
✅ Row-level security (RLS) for RBAC
Trade-off:

❌ MongoDB is more flexible (schema evolution easier)
✅ But we know our domain (judo academy) → schema stable
Revisit: Phase 2 if reporting queries become bottleneck.

ADR-002: Why JWT instead of Sessions?
Decision: Use JWT tokens instead of server-side sessions.

Rationale:

✅ Stateless (easier to scale horizontally)
✅ Works with mobile/offline experience
✅ Standard for SPAs + REST APIs
✅ Reduced server memory (no session table)
Trade-off:

❌ Tokens can't be revoked instantly (use short TTL + refresh pattern)
✅ Acceptable for MVP (immediate revocation Phase 2 with blacklist)
11. Risks & Mitigations
Risk	Probability	Impact	Mitigation
LGPD Violation	Low	CRITICAL	Legal review pre-MVP, encryption day 1, audit logs
Data Loss (backup failure)	Medium	HIGH	Test restore monthly, 2-region backup
Performance Degradation	Medium	HIGH	Load test 100 users, cache strategy, indexes
RBAC Bypass	Low	CRITICAL	Code review, unit tests, integration tests
Offline Sync Conflict	Medium	MEDIUM	LWW strategy tested, manual resolution Phase 2
12. Success Criteria
✅ Production deployment with 99% uptime
✅ Professor can register training in <5 minutes
✅ Student sees progress graph (<1s load)
✅ Zero LGPD violations (audit trail proves compliance)
✅ 70%+ professor adoption in first month
✅ <200ms API response (p95)
✅ All tests passing (unit + integration + E2E)
Architecture Document Complete. Ready for implementation.


---

## ✅ **Seu Plano Arquitetônico está Pronto!**

Este documento fornece:
- ✅ Arquitetura visual completa (diagrama alto-nível)
- ✅ Stack justificado (Angular + Node + PostgreSQL)
- ✅ Security & LGPD deep-dive (compliance garantida)
- ✅ Performance targets com estratégias
- ✅ Offline/sync architecture
- ✅ Detalhes de cada serviço (UserService, TrainingService, etc)
- ✅ API contract specification
- ✅ DevOps / CI-CD pipeline
- ✅ Implementation roadmap (7 sprints)
- ✅ Architecture Decision Records (trade-offs documentados)
- ✅ Risk mitigation

**Próximos Passos?**

**[U]** → Create UX Design (Wireframes)  
**[E]** → Create Epics & Stories  
**[T]** → Generate E2E Tests  
**[Q]** → Deixa para depois

Qual você prefere? 🚀---

## ✅ **Seu Plano Arquitetônico está Pronto!**

Este documento fornece:
- ✅ Arquitetura visual completa (diagrama alto-nível)
- ✅ Stack justificado (Angular + Node + PostgreSQL)
- ✅ Security & LGPD deep-dive (compliance garantida)
- ✅ Performance targets com estratégias
- ✅ Offline/sync architecture
- ✅ Detalhes de cada serviço (UserService, TrainingService, etc)
- ✅ API contract specification
- ✅ DevOps / CI-CD pipeline
- ✅ Implementation roadmap (7 sprints)
- ✅ Architecture Decision Records (trade-offs documentados)
- ✅ Risk mitigation