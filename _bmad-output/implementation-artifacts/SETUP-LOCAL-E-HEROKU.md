# 🚀 SCAcademia — Setup Local + Deploy Heroku

**Status:** ✅ Local Development | 🌐 Heroku Production  
**Language:** Português Brasileiro  
**Last Updated:** 2026-03-20

---

## 📋 Índice Rápido

1. [Setup Local (Development)](#setup-local-development)
2. [PostgreSQL Setup](#postgresql-setup)
3. [Rodando a Aplicação](#rodando-a-aplicação)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Deploy no Heroku (Produção)](#deploy-no-heroku-produção)
6. [CI/CD com GitHub Actions](#cicd-com-github-actions)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ Setup Local (Development)

### Pré-requisitos

```bash
# Verificar versões instaladas
node --version        # Requer v18 ou superior
npm --version         # v8+
git --version         # v2+
```

### 1️⃣ Clonar Repositório

```bash
git clone https://github.com/seu-usuario/SCAcademia.git
cd SCAcademia
```

### 2️⃣ Instalar Dependências

```bash
# Backend
npm install

# Frontend (se em separate folder)
cd frontend
npm install
cd ..
```

### 3️⃣ Copiar Variáveis de Ambiente

```bash
# Backend
cp .env.example .env

# Frontend
cd frontend
cp .env.example .env
cd ..
```

### 4️⃣ Arquivo `.env` (Backend)

```env
# ========== DATABASE ==========
DATABASE_URL=postgresql://postgres:password@localhost:5432/scacademia_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=scacademia_dev

# ========== SERVER ==========
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# ========== JWT ==========
JWT_SECRET=seu-secreto-super-seguro-aqui-dev
JWT_EXPIRES_IN=7d

# ========== EMAIL (Opcional - Development) ==========
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=

# ========== LOGGING ==========
LOG_LEVEL=debug
```

### 5️⃣ Arquivo `.env` (Frontend)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=SCAcademia Dev
NODE_ENV=development
```

---

## 🗄️ PostgreSQL Setup

### Opção A: PostgreSQL Nativo (Recomendado para Dev)

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
1. Download: [postgresql.org/download/windows](https://postgresql.org/download/windows)
2. Instalar com padrões (porta 5432)
3. Credentials: user=`postgres`, password=`password`

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2️⃣ Criar Banco de Dados

```bash
# Conectar como superuser
psql -U postgres

# No prompt psql:
CREATE DATABASE scacademia_dev;
CREATE USER scacademia WITH PASSWORD 'password';
ALTER ROLE scacademia_dev WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE scacademia_dev TO scacademia;

# Sair
\q
```

### 3️⃣ Verificar Conexão

```bash
psql -U postgres -d scacademia_dev -h localhost -p 5432
# Deve conectar sem erros
\q
```

### Opção B: PostgreSQL com Docker (Apenas para Database)

Se já tiver Docker instalado:

```bash
# Iniciar PostgreSQL
docker run --name postgres-scacademia \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=scacademia_dev \
  -p 5432:5432 \
  -d postgres:14

# Parar quando terminar dev
docker stop postgres-scacademia
docker rm postgres-scacademia
```

---

## ▶️ Rodando a Aplicação

### 1️⃣ Executar Migrações (First Time Only)

```bash
# Backend
npm run db:migrate

# Saída esperada:
# ✓ Flyway V1__initial.sql executed
# ✓ Flyway V2__judo.sql executed
# ✓ Flyway V3__health.sql executed
# ✓ Flyway V4__audit.sql executed
# ✓ Flyway V5__indexes.sql executed
```

### 2️⃣ Popular Dados de Seed (First Time Only)

```bash
npm run db:seed

# Saída esperada:
# ✓ Seed data inserted (50+ records)
```

### 3️⃣ Iniciar Backend (Terminal 1)

```bash
npm run dev

# Saída esperada:
# ✓ Server running on http://localhost:3000
# ✓ Database connected
# ✓ Ready for requests
```

### 4️⃣ Iniciar Frontend (Terminal 2)

```bash
cd frontend
npm run dev

# Saída esperada:
# ✓ VITE v4.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

### 5️⃣ Acessar Aplicação

```
Frontend: http://localhost:5173
Backend:  http://localhost:3000/api
```

---

## 📁 Estrutura do Projeto

```
SCAcademia/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.ts          # Login, Register, JWT
│   │   │   ├── health.ts        # Health records
│   │   │   ├── training.ts      # Training sessions
│   │   │   ├── students.ts      # Student dashboard
│   │   │   └── admin.ts         # Admin endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT validation
│   │   │   ├── rbac.ts          # Role-based access
│   │   │   └── error.ts         # Error handling
│   │   └── controllers/         # Business logic
│   │
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── V1__initial.sql
│   │   │   ├── V2__judo.sql
│   │   │   ├── V3__health.sql
│   │   │   ├── V4__audit.sql
│   │   │   └── V5__indexes.sql
│   │   ├── seed-data.sql        # Sample data
│   │   └── schema.sql           # Full DDL
│   │
│   └── lib/
│       ├── jwt.ts
│       ├── password.ts
│       └── email.ts
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Training.tsx
│   │   │   └── Admin.tsx
│   │   ├── components/
│   │   └── lib/
│   └── vite.config.ts
│
├── .env.example
├── .github/
│   └── workflows/
│       ├── test.yml             # Run tests
│       └── deploy.yml           # Deploy to Heroku
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🌐 Deploy no Heroku (Produção)

### Pré-requisitos

1. **Heroku CLI**: [Download](https://devcenter.heroku.com/articles/heroku-cli)
2. **Heroku Account**: [Criar conta](https://signup.heroku.com)
3. **GitHub Account**: Com repo do projeto

### 1️⃣ Criar App no Heroku

```bash
# Login
heroku login

# Criar app
heroku create scacademia-prod

# Saída:
# Creating ⬢ scacademia-prod... done
# https://scacademia-prod.herokuapp.com/ | https://git.heroku.com/scacademia-prod.git
```

### 2️⃣ Configurar PostgreSQL em Produção

```bash
# Adicionar Heroku Postgres
heroku addons:create heroku-postgresql:hobby-dev --app scacademia-prod

# Saída:
# Database has been created and is available as DATABASE_URL

# Verificar
heroku config --app scacademia-prod
```

### 3️⃣ Configurar Variáveis de Ambiente (Production)

```bash
heroku config:set \
  NODE_ENV=production \
  PORT=5000 \
  JWT_SECRET=$(openssl rand -hex 32) \
  LOG_LEVEL=info \
  --app scacademia-prod
```

**Variáveis importantes:**
```env
NODE_ENV=production
JWT_SECRET=<gere com: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
DATABASE_URL=<auto-configurado pelo Heroku>
```

### 4️⃣ Preparar Procfile

Criar arquivo na raiz do projeto: `Procfile`

```procfile
# Backend API
web: npm run start

# Não usar: npm run dev (modo development)
```

### 5️⃣ Criar `package.json` com Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "db:migrate": "npm run db:migrate:prod",
    "db:migrate:prod": "flyway migrate",
    "test": "vitest run"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### 6️⃣ Deploy Manual (Primeira Vez)

```bash
# Build localmente
npm run build

# Deploy para Heroku (via git)
git remote add heroku https://git.heroku.com/scacademia-prod.git
git push heroku main

# Saída esperada:
# -----> Building on the Heroku-20 stack
# -----> Node.js app detected
# -----> Installing dependencies
# -----> Running build
# -----> Deploying app

# Executar migrações em produção
heroku run npm run db:migrate --app scacademia-prod
```

### 7️⃣ Testar Produção

```bash
# Ver logs
heroku logs --app scacademia-prod --tail

# Testar API
curl https://scacademia-prod.herokuapp.com/api/health

# Espera resposta:
# {"status": "ok", "timestamp": "2026-03-20T..."}
```

---

## 🔄 CI/CD com GitHub Actions

### Arquivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Deploy to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
          HEROKU_APP_NAME: scacademia-prod
        run: |
          git remote add heroku https://git.heroku.com/${{ env.HEROKU_APP_NAME }}.git
          git push heroku main --force

      - name: Run migrations (Heroku)
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
          HEROKU_APP_NAME: scacademia-prod
        run: |
          heroku run npm run db:migrate --app ${{ env.HEROKU_APP_NAME }}
```

### Configurar GitHub Secrets

1. Ir para: **Settings → Secrets and variables → Actions**
2. Adicionar: `HEROKU_API_KEY`
   - Valor: Token do Heroku (obter em: `heroku auth:token`)

```bash
# Gerar token
heroku auth:token

# Copiar para GitHub Secrets
```

---

## 🎯 Workflow de Desenvolvimento

### Daily Workflow

```bash
# 1. Atualizar código local
git pull origin main

# 2. Criar branch de feature
git checkout -b feature/epic-1-auth

# 3. Implementar story
# ... escrever código ...

# 4. Executar testes localmente
npm test

# 5. Commitar e push
git add .
git commit -m "feat: implement admin creates academy (story 1.1)"
git push origin feature/epic-1-auth

# 6. Abrir Pull Request (GitHub)
# ... aguardar CI/CD passar ...

# 7. Mergear após aprovação (main branch automaticamente deploya)
```

### Deploy Automático

```
push → GitHub Actions (test) → Deploy (Heroku) → Migrations → Live ✓
```

---

## 🏥 Troubleshooting

### Erro: "Database connection refused"

```bash
# Verificar PostgreSQL está rodando
psql -U postgres -c "SELECT 1"

# Se não funcionar:
# macOS: brew services start postgresql@14
# Linux: sudo systemctl start postgresql
# Windows: Abrir Services > PostgreSQL
```

### Erro: "Migration failed"

```bash
# Ver logs da migração
npm run db:migrate -- --info

# Rollback última migração (se necessário)
npm run db:rollback

# Limpar e recriar (APENAS EM DEV)
npm run db:reset
```

### Erro: Heroku deployment lento

```bash
# Aumentar dyno
heroku dyos:type Standard-1X --app scacademia-prod

# Ver custos
heroku billing --app scacademia-prod
```

### Erro: "Cannot find module"

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro: JWT_SECRET não definido

```bash
# Local: verificar .env
grep JWT_SECRET .env

# Production:
heroku config:get JWT_SECRET --app scacademia-prod

# Se não existir, definir:
heroku config:set JWT_SECRET=$(openssl rand -hex 32) --app scacademia-prod
```

---

## 📊 Monitoramento

### Logs Local

```bash
# Ver todos os logs
npm run dev

# Filtrar por erro
npm run dev | grep ERROR
```

### Logs Heroku

```bash
# Tempo real
heroku logs --app scacademia-prod --tail

# Últimas 100 linhas
heroku logs --app scacademia-prod -n 100

# Só erros
heroku logs --app scacademia-prod --tail -d app
```

### Metrics (Heroku)

```bash
# CPU, Memory, Dyno usage
heroku metrics --app scacademia-prod

# Status page
open https://status.heroku.com
```

---

## 🔐 Segurança

### Antes de Deploy em Produção

- [ ] `JWT_SECRET` é salvo em GitHub Secrets (nunca no`.env`)
- [ ] `DATABASE_URL` é gerada automaticamente pelo Heroku
- [ ] CORS configurado apenas para domínios conhecidos
- [ ] Rate limiting ativado em endpoints críticos
- [ ] HTTPS ativado (automático no Heroku)
- [ ] Sem logs de senhas/tokens
- [ ] Dependências com `npm audit`

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix
```

---

## 📚 Referências Rápidas

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar dev server |
| `npm run db:migrate` | Executar migrações |
| `npm run db:seed` | Popular dados teste |
| `npm test` | Rodar testes |
| `npm run build` | Build para produção |
| `heroku logs --tail` | Ver logs em tempo real |
| `heroku config` | Ver variáveis de ambiente |

---

## ✅ Checklist Pre-Deploy

Antes de mergear qualquer PR para `main` (que dispara auto-deploy):

- [ ] Local tests passing (`npm test`)
- [ ] No console errors (`npm run dev`)
- [ ] migrations tested locally
- [ ] `.env` is in `.gitignore`
- [ ] No secrets hardcoded
- [ ] Code reviewed by 1+ developer
- [ ] GitHub Actions workflow passed
- [ ] Ready for production ✓

---

**Status:** ✅ Ready for Local Development  
**Next:** Configure setup local conforme acima, depois comece com Story 1.1

**Questions?** Check logs with `npm run dev` or `heroku logs --tail`
