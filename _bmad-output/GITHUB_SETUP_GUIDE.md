# GitHub Repository Structure & Setup Guide

## SCAcademia — Judo Academy Management System

### Project Structure

```
scacademia/
├── .github/
│   ├── workflows/
│   │   ├── ci-backend.yml
│   │   ├── ci-frontend.yml
│   │   ├── deploy-production.yml
│   │   └── database-migration.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── story.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   └── validators/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── health/
│   │   │   ├── judo/
│   │   │   └── sync/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── config/
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── aluno/
│   │   │   ├── professor/
│   │   │   ├── admin/
│   │   │   └── common/
│   │   ├── pages/
│   │   ├── services/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   └── sync/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── database/
│   ├── migrations/
│   │   ├── V1_0__Core_Identity.sql
│   │   ├── V2_0__Health_LGPD.sql
│   │   ├── V3_0__Training.sql
│   │   ├── V4_0__Progress_Judo.sql
│   │   └── V5_0__Sync_Monitor.sql
│   ├── seeds/
│   │   └── seed-data.sql
│   ├── schema.sql
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── TESTING.md
│
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── README.md
├── CONTRIBUTING.md
└── LICENSE

```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose (v20+)
- Node.js 18+ (for local development)
- Git

### Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/mvs-br/scacademia.git
   cd scacademia
   ```

2. **Copy Environment Files**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start Docker Stack**
   ```bash
   docker-compose up -d
   ```

4. **Initialize Database** (First Run)
   ```bash
   # Wait for postgres to be healthy (10-15 seconds)
   docker-compose exec postgres psql -U root -d scacademia -f /seeds/seed-data.sql
   ```

5. **Verify Services**
   - **API:** http://localhost:3000
   - **Frontend:** http://localhost:4200
   - **Adminer (DB UI):** http://localhost:8080
   - **Redis Commander:** http://localhost:8081

---

## Development Workflow

### Backend Development

```bash
# Install dependencies
cd backend
npm install

# Start development server (with hot reload)
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```

### Frontend Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Database Changes

```bash
# Create new migration
touch database/migrations/V6_0__Your_Changes.sql

# Apply migrations (automatic with Docker)
docker-compose restart postgres
```

---

## Testing

### Unit Tests
```bash
npm test                 # Backend unit tests
npm run test:unit        # Frontend unit tests
```

### Integration Tests
```bash
npm run test:integration # Backend integration tests
```

### E2E Tests
```bash
npm run test:e2e         # Full stack E2E tests
```

---

## API Endpoints (Base URLs)

**Development:** `http://localhost:3000/api`
**Production:** `https://api.scacademia.com.br/api`

### Core Resources
- `POST /auth/login` — User authentication
- `GET /profile` — Current user profile
- `GET /academy/:academy_id/alunos` — List students
- `GET /academy/:academy_id/turmas` — List classes
- `POST /academy/:academy_id/turmas` — Create class
- `GET /aluno/:student_id/faixas` — Belt history
- `POST /aluno/:student_id/faixa` — Record belt progression
- `GET /academy/:academy_id/sessions` — Training sessions
- `POST /academy/:academy_id/sessions` — Create session
- `GET /academy/:academy_id/attendance` — Attendance records

---

## Database Schema

**31 Tables Total:**

**Core Identity (6):**
- academies, users, roles, permissions, role_permissions, auth_tokens

**Health & LGPD (6):**
- health_records, judo_profile, judo_belt_history, student_guardians, consents, consent_templates

**Training (7):**
- turmas, turma_students, training_sessions, session_attendance, techniques, session_techniques, session_comments

**Progress (3):**
- student_progress, badges, student_badges

**System (5):**
- audit_logs, sync_queue, notifications, system_health, alerts

**Key Features:**
- Multi-tenant architecture (isolated by academy_id)
- LGPD compliance (encrypted health fields, 7-year audit retention)
- Judo belt progression tracking (current + historical audit trail)
- Offline-first sync queue
- Real-time notifications
- System monitoring & alerts

---

## Configuration

### Environment Variables

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=root
DB_PASSWORD=development123
DB_NAME=scacademia

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# API
API_PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-change-in-production
JWT_EXPIRY=24h

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
```

---

## Deployment

### Production Checklist

1. **Security**
   - [ ] Change all default passwords
   - [ ] Set strong JWT_SECRET
   - [ ] Enable SSL/TLS certificates
   - [ ] Configure CORS properly
   - [ ] Enable rate limiting

2. **Database**
   - [ ] Setup automated backups
   - [ ] Enable replication
   - [ ] Configure monitoring
   - [ ] Test restore procedures

3. **CI/CD**
   - [ ] Run tests on every PR
   - [ ] Code coverage > 80%
   - [ ] Enable branch protection
   - [ ] Require code review

4. **Monitoring**
   - [ ] Setup error tracking (Sentry)
   - [ ] Setup performance monitoring (New Relic/Datadog)
   - [ ] Configure alerting
   - [ ] Setup log aggregation

### Deploy to Production

```bash
# Using docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Or using Kubernetes (if configured)
kubectl apply -f k8s/
```

---

## Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/your-feature`
3. **Commit** changes: `git commit -am 'Add feature'`
4. **Push** to branch: `git push origin feature/your-feature`
5. **Create** Pull Request with description

**Code Standards:**
- TypeScript strict mode
- ESLint + Prettier
- Minimum 80% test coverage
- PT-BR language for strings/comments
- BDD format for tests

---

## Project Team

### Roles

- **Product Manager:** Priorizações, roadmap, releases
- **Architect:** Design de soluções, tech decisions
- **Lead Backend:** Node.js/Express, database, APIs
- **Lead Frontend:** React/Angular, UX, performance
- **QA Lead:** Test automation, quality gates
- **DevOps:** Infrastructure, CI/CD, deployments
- **Scrum Master:** Sprint planning, blockers management

---

## Support & Documentation

- **API Docs:** `/api/docs` (Swagger)
- **Database Diagram:** `docs/DATABASE.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Contributing:** `CONTRIBUTING.md`

---

## License

This project is licensed under MIT License. See `LICENSE` for details.

---

## Status

- **Version:** 1.0.0-alpha
- **Last Updated:** 2026-03-20
- **Status:** 🟡 Development Phase
- **Next Milestone:** Backend API Implementation (Epic 1)

---

**Need Help?** Open an issue on GitHub or contact the team on Slack.
