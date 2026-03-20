do $$
declare
  merchant_type text;
  note_type text;
begin
  select data_type into merchant_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'transactions'
    and column_name = 'merchant';

  if merchant_type = 'bytea' then
    alter table transactions
      alter column merchant type varchar(255)
      using convert_from(merchant, 'UTF8');
  end if;

  select data_type into note_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'transactions'
    and column_name = 'note';

  if note_type = 'bytea' then
    alter table transactions
      alter column note type text
      using convert_from(note, 'UTF8');
  end if;
end $$;

