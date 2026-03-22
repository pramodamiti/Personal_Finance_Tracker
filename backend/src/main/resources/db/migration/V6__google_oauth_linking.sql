alter table users add column google_sub varchar(255);
alter table users add column google_linked_at timestamptz;

create unique index if not exists idx_users_google_sub
  on users(google_sub)
  where google_sub is not null;
