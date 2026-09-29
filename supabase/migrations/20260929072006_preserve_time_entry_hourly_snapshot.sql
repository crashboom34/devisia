-- A time entry records the labor cost that was valid when it was first
-- entered. Later corrections may change the duration, but never rewrite that
-- historical rate, even when a forged client bypasses the application UI.

create or replace function private.preserve_time_entry_hourly_snapshot()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  new.hourly_cost_cents_snapshot := old.hourly_cost_cents_snapshot;
  return new;
end;
$$;

revoke all on function private.preserve_time_entry_hourly_snapshot() from public, anon;

drop trigger if exists preserve_time_entry_hourly_snapshot on public.time_entries;
create trigger preserve_time_entry_hourly_snapshot
before update of hourly_cost_cents_snapshot on public.time_entries
for each row execute function private.preserve_time_entry_hourly_snapshot();
