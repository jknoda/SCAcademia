#!/bin/bash
# scacademia-setup.sh
# Automated setup script for SCAcademia development environment

set -e

# ============================================================================
# Colors for output
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_success "$1 is installed"
    return 0
}

# ============================================================================
# Main Setup
# ============================================================================

print_header "SCAcademia Development Environment Setup"

# Check prerequisites
print_header "Checking Prerequisites"

check_command "docker" || exit 1
check_command "docker-compose" || exit 1
check_command "git" || exit 1

print_success "All prerequisites installed"

# Create environment files
print_header "Setting up Environment Files"

if [ ! -f .env ]; then
    print_warning "Creating .env from template"
    cat > .env << 'EOF'
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_USER=root
DB_PASSWORD=development123
DB_NAME=scacademia
REDIS_HOST=redis
REDIS_PORT=6379
API_PORT=3000
FRONTEND_PORT=4200
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRY=24h
EOF
    print_success ".env created"
else
    print_warning ".env already exists"
fi

if [ ! -f backend/.env ]; then
    print_warning "Creating backend/.env from template"
    mkdir -p backend
    cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USER=root
DB_PASSWORD=development123
DB_NAME=scacademia
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=backend-secret-key
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:4200
EOF
    print_success "backend/.env created"
else
    print_warning "backend/.env already exists"
fi

if [ ! -f frontend/.env ]; then
    print_warning "Creating frontend/.env from template"
    mkdir -p frontend
    cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
EOF
    print_success "frontend/.env created"
else
    print_warning "frontend/.env already exists"
fi

# Create directory structure
print_header "Creating Directory Structure"

mkdir -p backend/src/{api,services,models,utils,config}
mkdir -p backend/tests/{unit,integration,e2e}
mkdir -p frontend/src/{components,pages,services,hooks,store,styles,types,utils}
mkdir -p frontend/tests/{unit,e2e}
mkdir -p database/{migrations,seeds}
mkdir -p docs
mkdir -p .github/workflows

print_success "Directory structure created"

# Start Docker services
print_header "Starting Docker Services"

docker-compose up -d

sleep 5

if docker-compose ps | grep -q "healthy"; then
    print_success "Docker services started"
else
    print_warning "Waiting for services to be healthy..."
    sleep 10
fi

# Check database connection
print_header "Verifying Database Connection"

if docker-compose exec -T postgres psql -U root -d scacademia -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection verified"
else
    print_error "Database connection failed"
    exit 1
fi

# Initialize database with seed data
print_header "Initializing Database with Sample Data"

if docker-compose exec -T postgres psql -U root -d scacademia < database/seeds/seed-data.sql 2>/dev/null; then
    print_success "Sample data loaded"
else
    print_warning "Could not load sample data (may already be loaded)"
fi

# Display service URLs
print_header "Services Ready 🚀"

echo "API Server:        http://localhost:3000"
echo "Frontend:          http://localhost:4200"
echo "Database Admin:    http://localhost:8080"
echo "Redis Commander:   http://localhost:8081"

print_header "Database Credentials"
echo "Host:     postgres"
echo "Port:     5432"
echo "User:     root"
echo "Password: development123"
echo "Database: scacademia"

print_header "Next Steps"
echo "1. Backend development:   cd backend && npm install && npm run dev"
echo "2. Frontend development:  cd frontend && npm install && npm start"
echo "3. Run tests:             npm test"
echo "4. View documentation:    Open docs/ folder"

print_success "Setup completed successfully!"
