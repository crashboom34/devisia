-- Minimal upstream schema for an empty, in-memory PostgreSQL database.
-- All audited financial tables, policies, triggers and RPCs come from migrations.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.user_id', true), '')::uuid
$$;
grant usage on schema auth to authenticated;
create table projects (id uuid primary key, user_id uuid, title text, client_name text, client_address text);
create table estimates (
  id uuid primary key, user_id uuid, project_id uuid references projects, estimate_kind text,
  categories jsonb, total_ht numeric, total_tva numeric, total_ttc numeric, total_amount numeric,
  discount_percent numeric, discount_amount numeric, client_name text, payment_terms text,
  execution_delay text, deposit_required numeric, special_conditions text,
  scenario_type text, estimate_number text, estimate_date timestamptz default now(),
  created_at timestamptz default now(), validity_days integer default 30,
  is_active boolean default true, estimate_data jsonb default '{}', line_items jsonb default '[]',
  regenerated_from_id uuid, model_used text, accepted_at timestamptz
);
create table clients (id uuid primary key, user_id uuid);
create table api_usage_logs (user_id uuid);
create table estimate_templates (id uuid primary key);
create table subscription_tiers (id uuid primary key default gen_random_uuid(), name text, is_active boolean default true);
create table user_subscriptions (user_id uuid, tier_id uuid, status text, updated_at timestamptz, created_at timestamptz);
create table ai_models (
  id uuid primary key default gen_random_uuid(), provider text, model_id text, display_name text,
  description text, cost_per_1k_tokens_input numeric, cost_per_1k_tokens_output numeric,
  max_tokens int, capabilities jsonb, is_active boolean, unique (provider, model_id)
);
create function is_admin() returns boolean language sql stable as $$ select false $$;
create function update_updated_at_column() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
insert into subscription_tiers(name) values ('pro');
