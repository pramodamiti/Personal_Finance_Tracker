create table rules (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references users(id),
  name varchar(255) not null,
  priority integer not null default 100,
  condition_json text not null,
  action_json text not null,
  active boolean not null default true
);

create index idx_rules_user_priority on rules(user_id, priority, created_at);
