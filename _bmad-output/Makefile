# SCAcademia Makefile
# Convenient commands for development, testing, and deployment

.PHONY: help setup start stop restart clean logs test lint build deploy

DEFAULT_GOAL := help

# ============================================================================
# HELP
# ============================================================================

help:
	@echo "SCAcademia Project — Available Commands"
	@echo ""
	@echo "Setup & Infrastructure:"
	@echo "  make setup              Setup development environment (docker + services)"
	@echo "  make start              Start Docker services"
	@echo "  make stop               Stop Docker services"
	@echo "  make restart            Restart Docker services"
	@echo "  make clean              Remove containers and volumes (WARNING: deletes data)"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate         Run database migrations"
	@echo "  make db-seed            Load sample data"
	@echo "  make db-backup          Backup database"
	@echo "  make db-restore         Restore database from backup"
	@echo "  make db-console         Open psql console"
	@echo "  make db-stats           Show database statistics"
	@echo ""
	@echo "Backend Development:"
	@echo "  make backend-install    Install backend dependencies"
	@echo "  make backend-dev        Start backend dev server"
	@echo "  make backend-test       Run backend tests"
	@echo "  make backend-test-cov   Run backend tests with coverage"
	@echo "  make backend-lint       Run backend linter"
	@echo "  make backend-build      Build backend"
	@echo ""
	@echo "Frontend Development:"
	@echo "  make frontend-install   Install frontend dependencies"
	@echo "  make frontend-dev       Start frontend dev server"
	@echo "  make frontend-test      Run frontend tests"
	@echo "  make frontend-lint      Run frontend linter"
	@echo "  make frontend-build     Build frontend"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test               Run all tests (backend + frontend)"
	@echo "  make test-e2e           Run end-to-end tests"
	@echo "  make lint               Run linters (backend + frontend)"
	@echo "  make coverage           Generate test coverage reports"
	@echo ""
	@echo "Deployment:"
	@echo "  make build-prod         Build production images"
	@echo "  make deploy-staging     Deploy to staging"
	@echo "  make deploy-prod        Deploy to production"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs               Show Docker logs (all services)"
	@echo "  make logs-backend       Show backend logs"
	@echo "  make logs-frontend      Show frontend logs"
	@echo "  make status             Show service status"
	@echo "  make docs               Generate documentation"
	@echo ""

# ============================================================================
# SETUP & INFRASTRUCTURE
# ============================================================================

setup:
	@echo "Setting up SCAcademia development environment..."
	@bash scacademia-setup.sh

start:
	@echo "Starting Docker services..."
	@docker-compose up -d
	@echo "✓ Services started"
	@echo "  API:      http://localhost:3000"
	@echo "  Frontend: http://localhost:4200"
	@echo "  Adminer:  http://localhost:8080"

stop:
	@echo "Stopping Docker services..."
	@docker-compose stop

restart:
	@echo "Restarting Docker services..."
	@docker-compose restart

clean:
	@echo "WARNING: This will delete all containers and data!"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✓ Cleaned up"; \
	fi

status:
	@echo "Service Status:"
	@docker-compose ps

logs:
	@docker-compose logs -f

logs-backend:
	@docker-compose logs -f backend

logs-frontend:
	@docker-compose logs -f frontend

# ============================================================================
# DATABASE
# ============================================================================

db-migrate:
	@echo "Applying database migrations..."
	@docker-compose exec -T postgres psql -U root -d scacademia \
		-f /migrations/V1_0__Core_Identity.sql
	@docker-compose exec -T postgres psql -U root -d scacademia \
		-f /migrations/V2_0__Health_LGPD.sql
	@docker-compose exec -T postgres psql -U root -d scacademia \
		-f /migrations/V3_0__Training.sql
	@docker-compose exec -T postgres psql -U root -d scacademia \
		-f /migrations/V4_0__Progress_Judo.sql
	@docker-compose exec -T postgres psql -U root -d scacademia \
		-f /migrations/V5_0__Sync_Monitor.sql
	@echo "✓ Migrations applied"

db-seed:
	@echo "Loading sample data..."
	@docker-compose exec -T postgres psql -U root -d scacademia < database/seeds/seed-data.sql
	@echo "✓ Sample data loaded"

db-console:
	@docker-compose exec postgres psql -U root -d scacademia

db-backup:
	@echo "Backing up database..."
	@docker-compose exec -T postgres pg_dump -U root scacademia > backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "✓ Backup created"

db-restore:
	@echo "Restoring database from latest backup..."
	@docker-compose exec -T postgres psql -U root -d scacademia < $$(ls -t backup-*.sql | head -1)
	@echo "✓ Database restored"

db-stats:
	@docker-compose exec -T postgres psql -U root -d scacademia \
		-c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size('$(schemaname).$(tablename)'::regclass)) AS size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# ============================================================================
# BACKEND
# ============================================================================

backend-install:
	@echo "Installing backend dependencies..."
	@cd backend && npm install
	@echo "✓ Backend dependencies installed"

backend-dev:
	@echo "Starting backend dev server..."
	@cd backend && npm run dev

backend-test:
	@echo "Running backend tests..."
	@cd backend && npm test

backend-test-cov:
	@echo "Running backend tests with coverage..."
	@cd backend && npm run test:coverage

backend-lint:
	@echo "Running backend linter..."
	@cd backend && npm run lint

backend-build:
	@echo "Building backend..."
	@cd backend && npm run build
	@echo "✓ Backend built"

# ============================================================================
# FRONTEND
# ============================================================================

frontend-install:
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✓ Frontend dependencies installed"

frontend-dev:
	@echo "Starting frontend dev server..."
	@cd frontend && npm start

frontend-test:
	@echo "Running frontend tests..."
	@cd frontend && npm test

frontend-lint:
	@echo "Running frontend linter..."
	@cd frontend && npm run lint

frontend-build:
	@echo "Building frontend..."
	@cd frontend && npm run build
	@echo "✓ Frontend built"

# ============================================================================
# TESTING & QUALITY
# ============================================================================

test:
	@echo "Running all tests..."
	@cd backend && npm test -- --coverage
	@cd frontend && npm test -- --coverage
	@echo "✓ All tests passed"

test-e2e:
	@echo "Running end-to-end tests..."
	@cd backend && npm run test:e2e
	@echo "✓ E2E tests passed"

lint:
	@echo "Running linters..."
	@cd backend && npm run lint
	@cd frontend && npm run lint
	@echo "✓ Linting complete"

coverage:
	@echo "Generating coverage reports..."
	@cd backend && npm run test:coverage
	@cd frontend && npm run test:coverage
	@echo "✓ Coverage reports generated"

# ============================================================================
# PRODUCTION BUILD & DEPLOYMENT
# ============================================================================

build-prod:
	@echo "Building production images..."
	@docker-compose -f docker-compose.prod.yml build
	@echo "✓ Production images built"

deploy-staging:
	@echo "Deploying to staging..."
	@docker-compose -f docker-compose.staging.yml up -d
	@echo "✓ Deployed to staging"
	@echo "URL: https://staging.scacademia.com.br"

deploy-prod:
	@echo "WARNING: Deploying to production!"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.prod.yml up -d; \
		echo "✓ Deployed to production"; \
		echo "URL: https://scacademia.com.br"; \
	fi

# ============================================================================
# DOCUMENTATION
# ============================================================================

docs:
	@echo "Generating documentation..."
	@echo "📚 Documentation files:"
	@ls -lh docs/*.md
	@echo ""
	@echo "Key files:"
	@echo "  - ARCHITECTURE.md:       System architecture"
	@echo "  - DATABASE.md:           Database schema"
	@echo "  - API.md:                API documentation"
	@echo "  - DEVELOPMENT.md:        Development guide"
	@echo "  - DEPLOYMENT.md:         Deployment guide"

# ============================================================================
# SHORTCUTS
# ============================================================================

install: backend-install frontend-install
	@echo "✓ All dependencies installed"

dev: start backend-dev
	@# This starts backend, run frontend in another terminal with: make frontend-dev

reset: clean setup db-migrate db-seed
	@echo "✓ Environment reset complete"

quick-start: setup start db-seed
	@echo "✓ Quick start complete!"
	@echo "Services running at:"
	@echo "  - API:        http://localhost:3000"
	@echo "  - Frontend:   http://localhost:4200"
	@echo "  - Adminer:    http://localhost:8080"
	@echo ""
	@echo "Next: run 'make backend-dev' in one terminal and 'make frontend-dev' in another"
