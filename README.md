# SCAcademia

Sistema web para gestão de academias, turmas, treinos e evolução de atletas, com foco em operações esportivas, acompanhamento técnico e conformidade com a LGPD.

---

## Visão geral

O SCAcademia foi construído para atender diferentes perfis de usuário dentro de uma academia:

- Administrador
- Professor
- Aluno
- Responsável

A aplicação centraliza cadastro, autenticação, controle de acesso, frequência, técnicas, indicadores de evolução, anamnese, consentimentos e monitoramento operacional.

---

## Principais funcionalidades

### Gestão da academia
- cadastro inicial da academia
- perfil da academia com dados fiscais, operacionais e de contato
- limites de usuários e armazenamento

### Usuários e autenticação
- registro e login
- autenticação com JWT
- controle de acesso por perfil
- recuperação e troca de senha

### Treinamento e operação
- cadastro de turmas
- controle de frequência
- registro de técnicas trabalhadas
- comentários por sessão
- histórico de treinos

### Evolução do atleta
- indicadores configuráveis
- avaliações por período
- alertas e snapshots de progresso
- visualização por grupos técnicos, físicos, táticos e competitivos

### Saúde e conformidade
- anamnese e dados de saúde
- consentimentos e fluxo LGPD
- auditoria de operações
- solicitações de exclusão de dados

### Administração e suporte
- monitoramento do sistema
- notificações
- backup e recuperação
- relatórios de compliance

---

## Arquitetura

### Frontend
- Angular
- TypeScript
- SCSS
- Angular Material

### Backend
- Node.js
- Express
- TypeScript
- Joi para validação
- JWT para autenticação

### Banco de dados
- PostgreSQL
- schema principal: scacademia

---

## Estrutura do repositório

- frontend: aplicação cliente
- backend: API e regras de negócio
- _bmad-output: artefatos funcionais, documentação e scripts SQL
- Documentos: materiais auxiliares do projeto

---

## Requisitos para execução local

- Node.js 18+ ou superior
- npm 9+ ou superior
- PostgreSQL 14+

---

## Como executar localmente

### 1. Backend

Entre na pasta do backend e instale as dependências:

```bash
cd backend
npm install
```

Configure as variáveis de ambiente necessárias, por exemplo:

```env
NODE_ENV=development
PGHOST=localhost
PGPORT=5432
PGDATABASE=scacademia
PGUSER=postgres
PGPASSWORD=sua_senha
DB_SCHEMA=scacademia
FRONTEND_URL=http://localhost:4200
```

Depois execute:

```bash
npm run build
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

### 2. Frontend

Entre na pasta do frontend e instale as dependências:

```bash
cd frontend
npm install
```

Para desenvolvimento local:

```bash
npm run serve
```

Para executar com o servidor Node usado no deploy:

```bash
npm start
```

A aplicação ficará disponível em:

```text
http://localhost:4200
```

---

## Banco de dados

O projeto possui um script consolidado para criação das tabelas principais em:

```text
backend/storage/scacademia-full-schema.sql
```

Se necessário, crie o schema e aplique o script no PostgreSQL antes de iniciar o sistema.

---

## Variáveis de ambiente importantes

### Backend
- NODE_ENV
- DATABASE_URL ou conjunto PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
- DB_SCHEMA
- FRONTEND_URL
- JWT_SECRET
- SMTP_SERVICE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

### Frontend
- em produção, a URL da API é embutida no build
- em desenvolvimento, a aplicação usa o backend local

---

## Deploy no Heroku

O projeto já possui arquivos Procfile para frontend e backend.

### Produção atual
- Frontend: https://scacademia-8b057ab90bd6.herokuapp.com/
- Backend: https://scacademiaapi-b8c5aaabd8a3.herokuapp.com/

### Backend no Heroku
Configurar no app da API:

- NODE_ENV=production
- PGHOST
- PGPORT
- PGDATABASE
- PGUSER
- PGPASSWORD
- DB_SCHEMA=scacademia
- FRONTEND_URL=https://scacademia-8b057ab90bd6.herokuapp.com

### Frontend no Heroku
- NODE_ENV=production
- PORT é fornecida automaticamente pelo Heroku

---

## Testes

### Frontend
```bash
cd frontend
npm test
```

### Backend
```bash
cd backend
npm test
```

---

## Observações

- o sistema usa atualização de interface com foco em fluxos administrativos e operacionais
- parte da documentação técnica complementar está disponível em _bmad-output
- o projeto está preparado para execução local e deploy em ambiente Heroku

---

## Licença

Uso interno e educacional, conforme a política do projeto.
