# Personal Finance Tracker

A full-stack monorepo implementation of a V1 personal finance tracker using React + TypeScript + Vite on the frontend and Java 21 + Spring Boot 3 + PostgreSQL on the backend.

## What was built

### Backend
- Spring Boot 3.3 API with layered packages for config, controllers, services, repositories, entities, mappers, security, exceptions, and scheduler.
- JWT auth with refresh tokens, BCrypt password hashing, register/login/logout/me endpoints, forgot-password and reset-password flows.
- Flyway migration for the initial PostgreSQL schema using UUID keys and finance-friendly numeric columns.
- CRUD APIs for accounts, categories, transactions, budgets, goals, recurring transactions, dashboard summaries, and reports.
- Transaction-safe balance update logic for income, expense, transfer, and goal contribution / withdrawal flows.
- Bucket4j-based request limiting for login and forgot-password.
- Spring scheduler for auto-creating due recurring transactions.
- Swagger/OpenAPI via springdoc.
- Audit logging table and service for money-impacting actions.

### Frontend
- React 18 + TypeScript + Vite app with Tailwind styling.
- Route-based authenticated shell with dashboard, transactions, budgets, goals, reports, recurring, accounts, and settings screens.
- TanStack Query for API data fetching and caching.
- Zustand-based auth persistence with Axios interceptors and token refresh handling.
- Responsive card/table layout with charts powered by Recharts.
- Basic data-entry forms for core resources and dashboard/report visualizations.

## Repository structure

```text
/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── .env.example
│   └── src/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    └── src/
```

## Codespaces + Neon setup

### Prerequisites
- Node.js 18+
- Java 21+
- Maven 3.9+
- A Neon PostgreSQL database

### 1. Configure environment
Copy the examples if desired:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set the backend to your Neon JDBC values and your Codespaces frontend URL. Set the frontend API URL to your forwarded backend URL.

Example:

```bash
export SPRING_DATASOURCE_URL='jdbc:postgresql://ep-your-neon-endpoint.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require'
export SPRING_DATASOURCE_USERNAME='neondb_owner'
export SPRING_DATASOURCE_PASSWORD='your-neon-password'
export APP_FRONTEND_URL='https://your-codespace-name-1455.app.github.dev'
export JWT_SECRET='change-me-super-secret-key-change-me-super-secret-key'
export SPRING_PROFILES_ACTIVE='local'
```

### 2. Run the backend
```bash
cd backend
./mvnw spring-boot:run
```

Backend URLs:
- API: `https://literate-dollop-g4w74qxwv945hr6g-8080.app.github.dev/`
- Swagger UI: `https://friendly-pancake-69749gv7xp9qhrwx-8080.app.github.dev/swagger-ui.html`

### 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend URL:
- `https://your-codespace-name-1455.app.github.dev`

## Product scope implemented

### In scope
- Authentication
- Dashboard
- Transactions CRUD
- Categories CRUD / archive
- Accounts / wallets
- Budgets
- Savings goals
- Recurring transactions
- Reporting and charts
- Search and filters support on transaction list API
- CSV export
- Responsive layout

### Explicitly not implemented in V1
- Open banking integrations
- Investment portfolio tracking
- Tax filing
- AI advice
- Shared family permissions
- Automated multi-currency conversion
- PDF export

## Implementation decisions and assumptions

- **Forgot password delivery:** local development uses a practical dev flow. A reset token is generated and printed by the backend, and MailHog is included in Docker Compose for teams that want SMTP inspection.
- **Default categories:** users receive a starter category set on registration.
- **Tags:** PostgreSQL `text[]` is used for transaction tags to keep the schema compact.
- **Recurring processing:** scheduler safety now uses distributed locking so multiple replicas can share the same PostgreSQL database safely.
- **System defaults vs user categories:** the current implementation seeds user-owned defaults at registration, which keeps user scoping simple.
- **Frontend forms:** the UI is intentionally pragmatic and demo-friendly rather than fully component-library-driven.
- **Demo data:** no automatic demo dataset is inserted; the app is ready for manual entry immediately after sign-up.

## API overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Accounts
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/{id}`
- `PUT /api/accounts/{id}`
- `DELETE /api/accounts/{id}`
- `POST /api/accounts/transfer`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

### Transactions
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/{id}`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`

### Budgets
- `GET /api/budgets?month=&year=`
- `POST /api/budgets`
- `PUT /api/budgets/{id}`
- `DELETE /api/budgets/{id}`
- `POST /api/budgets/duplicate-last-month?month=&year=`

### Goals
- `GET /api/goals`
- `POST /api/goals`
- `GET /api/goals/{id}`
- `PUT /api/goals/{id}`
- `DELETE /api/goals/{id}`
- `POST /api/goals/{id}/contribute`
- `POST /api/goals/{id}/withdraw`
- `POST /api/goals/{id}/complete`

### Recurring
- `GET /api/recurring`
- `POST /api/recurring`
- `GET /api/recurring/{id}`
- `PUT /api/recurring/{id}`
- `DELETE /api/recurring/{id}`
- `POST /api/recurring/{id}/pause`
- `POST /api/recurring/{id}/resume`

### Reports and dashboard
- `GET /api/reports/category-spend`
- `GET /api/reports/income-vs-expense`
- `GET /api/reports/account-balance-trend`
- `GET /api/reports/savings-progress`
- `GET /api/reports/export/csv`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent-transactions`
- `GET /api/dashboard/upcoming-bills`
- `GET /api/dashboard/budget-overview`
- `GET /api/dashboard/goals-overview`
- `GET /api/dashboard/spending-by-category`
- `GET /api/dashboard/income-vs-expense-trend`

## Follow-up items

Small non-blocking next steps if you want to keep iterating:
- Add richer edit/delete UI flows and modal-based resource forms on the frontend.
- Expand automated backend and frontend tests.
- Harden report endpoints with database-level aggregate queries instead of in-memory aggregation.
- Add production email templates and Codespaces-friendly dev mail handling if you need password reset email testing without SMTP.
