create extension if not exists "uuid-ossp";

create table users (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  display_name varchar(255) not null,
  active boolean not null default true
);
create table refresh_tokens (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), token varchar(512) not null unique, expires_at timestamptz not null, revoked boolean not null default false
);
create table password_reset_tokens (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), token varchar(512) not null unique, expires_at timestamptz not null, used boolean not null default false
);
create table accounts (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), name varchar(255) not null, type varchar(50) not null, opening_balance numeric(12,2) not null default 0, current_balance numeric(12,2) not null default 0, institution_name varchar(255), archived boolean not null default false
);
create table categories (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid references users(id), name varchar(255) not null, type varchar(50) not null, icon varchar(100), color varchar(20), archived boolean not null default false, system_default boolean not null default false
);
create table recurring_transactions (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), account_id uuid references accounts(id), destination_account_id uuid references accounts(id), category_id uuid references categories(id), transaction_type varchar(50) not null, frequency varchar(50) not null, amount numeric(12,2) not null, title varchar(255) not null, merchant varchar(255), note text, start_date date not null, end_date date, next_run_date date not null, active boolean not null default true, auto_create_transaction boolean not null default true
);
create table transactions (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), account_id uuid references accounts(id), destination_account_id uuid references accounts(id), category_id uuid references categories(id), recurring_transaction_id uuid references recurring_transactions(id), type varchar(50) not null, payment_method varchar(50), amount numeric(12,2) not null, transaction_date date not null, merchant varchar(255), note text, tags text[]
);
create table budgets (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), category_id uuid not null references categories(id), amount numeric(12,2) not null, budget_month integer not null, budget_year integer not null,
  unique(user_id, category_id, budget_month, budget_year)
);
create table goals (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), linked_account_id uuid references accounts(id), name varchar(255) not null, target_amount numeric(12,2) not null, current_amount numeric(12,2) not null default 0, icon varchar(100), color varchar(20), target_date date, status varchar(50) not null default 'ACTIVE'
);
create table audit_logs (
  id uuid primary key default uuid_generate_v4(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid references users(id), action varchar(100) not null, entity_name varchar(100) not null, entity_id varchar(100), details text
);
create index idx_transactions_user_date on transactions(user_id, transaction_date);
create index idx_transactions_category on transactions(category_id);
create index idx_transactions_account on transactions(account_id);
create index idx_recurring_next_run on recurring_transactions(next_run_date);
