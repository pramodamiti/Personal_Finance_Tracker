# Personal Finance Tracker

A full-stack **personal finance management web application** that helps users track **income**, **expenses**, **budgets**, **savings goals**, **recurring payments**, and **financial trends** in one place.

Built with **React**, **Java Spring Boot**, and **PostgreSQL**, the app is designed for fast transaction entry, clear financial insights, and a responsive user experience across desktop and mobile web.

## Repository Description

**Personal Finance Tracker** is a full-stack web app built with **React, Spring Boot, and PostgreSQL** to manage transactions, budgets, savings goals, recurring bills, accounts, and financial reports.

## Problem Statement

Managing personal finances across bank accounts, cash, subscriptions, budgets, and savings goals can become difficult without a single system that provides both quick data entry and clear reporting.

This project solves that problem by giving users a simple finance dashboard where they can:
- record transactions quickly
- track monthly spending by category
- compare budget vs actual spending
- manage savings goals
- monitor recurring bills and subscriptions
- review trends through charts and reports

## Key Features

### Authentication
- User registration with email, password, and display name
- Secure login and logout
- Forgot password and reset password flow
- JWT-based authentication with refresh token support

### Dashboard
- Current month income summary
- Current month expense summary
- Net balance overview
- Budget progress cards
- Spending by category chart
- Income vs expense trend chart
- Recent transactions widget
- Upcoming recurring payments widget
- Savings goal progress summary

### Transactions
- Add income, expense, and transfer transactions
- Edit and delete transactions
- Search by merchant or note
- Filter by date, category, amount, type, and account
- Support for back-dated entries
- Pagination or infinite scrolling for large datasets

### Categories
- Default income and expense categories
- Create custom categories
- Update category icon and color
- Archive categories
- Separate income and expense category types

### Accounts
- Manage bank accounts, credit cards, cash wallets, and savings accounts
- Track opening and current balances
- Transfer funds between accounts
- View balances by account

### Budgets
- Set monthly budgets by category
- Track budget vs actual spending
- Budget threshold alerts at 80%, 100%, and 120%
- Duplicate last month's budget

### Goals
- Create savings goals with target amounts and deadlines
- Add contributions and withdrawals
- Track progress percentage
- Mark goals as completed

### Recurring Transactions
- Create recurring salary, subscriptions, and bills
- Define frequency: daily, weekly, monthly, yearly
- View upcoming recurring payments
- Auto-generate transactions through a scheduled background job
- Pause or delete recurring items

### Reports
- Monthly spending report
- Category breakdown report
- Income vs expense trends
- Account balance trend
- Savings progress analytics
- CSV export support

## Tech Stack

### Frontend
- React
- React Router
- TanStack Query
- Zustand or Redux Toolkit
- React Hook Form
- Zod
- Recharts
- Axios

### Backend
- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT authentication
- Scheduled jobs for recurring transactions

### Database
- PostgreSQL

## Project Goals

The main objective of this application is to help individuals:
- understand where their money goes
- stay on top of monthly budgets
- track savings growth over time
- avoid missing recurring bills
- make better financial decisions using simple reports and charts

## User Personas

### Young Professional
Needs quick expense logging, monthly budget control, and spending insights.

### Freelancer
Needs multiple income sources, flexible categorization, and clear monthly cash flow visibility.

### Goal-Oriented Saver
Needs savings goals, contribution tracking, and recurring reminders.

## Core Modules

- **Auth**
- **Dashboard**
- **Transactions**
- **Categories**
- **Accounts**
- **Budgets**
- **Goals**
- **Recurring Transactions**
- **Reports**
- **Settings**

## Main Navigation

- Dashboard
- Transactions
- Budgets
- Goals
- Reports
- Recurring
- Accounts
- Settings

## Sample API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Transactions
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/{id}`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

### Accounts
- `GET /api/accounts`
- `POST /api/accounts`
- `PUT /api/accounts/{id}`
- `POST /api/accounts/transfer`

### Budgets
- `GET /api/budgets?month=3&year=2026`
- `POST /api/budgets`
- `PUT /api/budgets/{id}`
- `DELETE /api/budgets/{id}`

### Goals
- `GET /api/goals`
- `POST /api/goals`
- `PUT /api/goals/{id}`
- `POST /api/goals/{id}/contribute`
- `POST /api/goals/{id}/withdraw`

### Reports
- `GET /api/reports/category-spend`
- `GET /api/reports/income-vs-expense`
- `GET /api/reports/account-balance-trend`

### Recurring Transactions
- `GET /api/recurring`
- `POST /api/recurring`
- `PUT /api/recurring/{id}`
- `DELETE /api/recurring/{id}`

## Suggested Project Structure

```bash
personal-finance-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   └── reports/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── src/main/java/com/example/finance/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── config/
│   │   ├── security/
│   │   └── exception/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   └── pom.xml
│
└── README.md
```

## Architecture Overview

### Frontend
The frontend is responsible for:
- rendering dashboard widgets and charts
- handling user input and validation
- managing authentication state
- fetching and caching server data
- managing filters, date ranges, and modal state

### Backend
The backend is responsible for:
- authentication and authorization
- business logic for transactions, budgets, goals, and recurring payments
- validation of financial data
- generating reports and summaries
- handling scheduled recurring transaction creation
- ensuring user-scoped access to all records

### Database
PostgreSQL stores:
- users
- accounts
- categories
- transactions
- budgets
- goals
- recurring transactions

## Database Entities

### Users
Stores registered user accounts and credentials.

### Accounts
Stores wallets, bank accounts, credit cards, and savings accounts.

### Categories
Stores user-defined and default income/expense categories.

### Transactions
Stores income, expense, and transfer records.

### Budgets
Stores monthly category-level budgets per user.

### Goals
Stores savings goals, progress, and target dates.

### Recurring Transactions
Stores subscriptions, recurring income, and scheduled bills.

## Validation Rules

### Transaction Rules
- amount is required and must be greater than 0
- date is required
- account is required
- category is required except for transfers
- transfers require source and destination accounts

### Budget Rules
- one budget per category per month per user
- budget amount must be greater than 0

### Goal Rules
- target amount must be greater than 0
- contribution should not exceed available balance when linked to an account

## Security

- JWT access tokens
- refresh tokens
- password hashing with BCrypt or Argon2
- server-side validation for financial inputs
- login rate limiting
- user-scoped data access
- HTTPS-only deployment

## Non-Functional Requirements

- dashboard load target under 2 seconds for normal users
- paginated APIs for large transaction histories
- transaction-safe balance updates
- daily database backups
- keyboard-accessible UI
- AA-compliant color contrast
- responsive design for desktop, tablet, and mobile

## Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- PostgreSQL
- Maven

### 1. Clone the repository
```bash
git clone https://github.com/your-username/personal-finance-tracker.git
cd personal-finance-tracker
```

### 2. Backend setup
```bash
cd backend
```

Create a PostgreSQL database, for example:
```sql
CREATE DATABASE personal_finance_tracker;
```

Configure your environment in `application.yml` or with environment variables.

Example configuration:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/personal_finance_tracker
    username: postgres
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

app:
  jwt:
    secret: your_jwt_secret
    expiration: 3600000
```

Run the backend:
```bash
./mvnw spring-boot:run
```

The backend should start on:
```bash
http://localhost:8080
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
```

Create a `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Run the frontend:
```bash
npm run dev
```

The frontend should start on:
```bash
http://localhost:5173
```

## Environment Variables

### Backend
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/personal_finance_tracker
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600000
REFRESH_TOKEN_EXPIRATION=604800000
```

### Frontend
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Example Transaction Payload

```json
{
  "type": "expense",
  "amount": 42.50,
  "date": "2026-03-13",
  "accountId": "uuid",
  "categoryId": "uuid",
  "merchant": "Grocery Mart",
  "note": "Weekly groceries",
  "tags": ["family", "weekly"]
}
```

## Build Roadmap

### Milestone 1
- Authentication
- Accounts
- Transactions CRUD
- Basic dashboard

### Milestone 2
- Categories
- Budgets
- Reports basics

### Milestone 3
- Goals
- Recurring transactions
- Export support
- Responsive polish

## Acceptance Criteria Highlights

### Dashboard
- shows current month summary cards
- shows recent transactions
- shows category spending chart

### Transactions
- user can add, edit, and delete transactions
- filters work correctly
- balances update after changes

### Budgets
- user can define monthly budgets
- progress reflects actual spend
- over-budget states are visible

### Goals
- user can create and contribute to savings goals
- goal progress updates correctly

### Reports
- date filters update charts and summaries
- exports return the correct filtered dataset

## Future Enhancements

- bank account sync
- receipt scanning
- AI-based categorization suggestions
- shared household budgets
- mobile app
- push notifications
- multi-currency support

## Why This Project?

This project is a strong example of a modern full-stack application because it combines:
- secure authentication
- relational data modeling
- financial business logic
- reporting and analytics
- background job scheduling
- responsive UI design

It is well suited for hackathons, portfolios, and real-world finance product learning.

## Status

V1 is focused on core personal finance workflows:
- auth
- transactions
- accounts
- budgets
- goals
- recurring payments
- reports

## Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a pull request

## License

Add your preferred license here, for example MIT, Apache-2.0, or GPL.

