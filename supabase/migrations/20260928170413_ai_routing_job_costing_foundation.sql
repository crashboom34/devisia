-- Devisia foundation: configurable AI routing, tenant-safe job costing and
-- explicit separation between commercial quote, initial budget and actuals.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Organizations and membership
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function private.is_org_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = (select auth.uid())
  );
$$;

create or replace function private.is_org_admin(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.is_org_admin(uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.is_org_admin(uuid) to authenticated, service_role;

insert into public.organizations (id, name, owner_user_id)
select id, coalesce(nullif(raw_user_meta_data->>'company_name', ''), split_part(email, '@', 1), 'Entreprise'), id
from auth.users
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role)
select id, id, 'owner' from auth.users
on conflict (organization_id, user_id) do nothing;

create or replace function private.bootstrap_default_organization()
returns trigger language plpgsql security definer set search_path = public, private
as $$
begin
  insert into public.organizations (id, name, owner_user_id)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), split_part(new.email, '@', 1), 'Entreprise'), new.id)
  on conflict (id) do nothing;
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.id, 'owner')
  on conflict (organization_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists bootstrap_default_organization on auth.users;
create trigger bootstrap_default_organization
after insert on auth.users for each row execute function private.bootstrap_default_organization();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "Members read their organizations" on public.organizations
for select to authenticated using (private.is_org_member(id));
create policy "Users create their organization" on public.organizations
for insert to authenticated with check ((select auth.uid()) = owner_user_id);
create policy "Owners update their organization" on public.organizations
for update to authenticated using (private.is_org_admin(id)) with check (private.is_org_admin(id));
create policy "Owners delete their organization" on public.organizations
for delete to authenticated using (owner_user_id = (select auth.uid()));

create policy "Members read organization membership" on public.organization_members
for select to authenticated using (private.is_org_member(organization_id));
create policy "Admins add organization members" on public.organization_members
for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "Admins update organization members" on public.organization_members
for update to authenticated using (private.is_org_admin(organization_id) and role <> 'owner')
with check (private.is_org_admin(organization_id) and role <> 'owner');
create policy "Admins remove organization members" on public.organization_members
for delete to authenticated using (private.is_org_admin(organization_id) and role <> 'owner');

-- Existing data remains compatible: every current user owns an organization
-- with the same UUID and legacy inserts are normalized by triggers.
alter table public.projects add column if not exists organization_id uuid references public.organizations(id);
alter table public.estimates add column if not exists organization_id uuid references public.organizations(id);
alter table public.clients add column if not exists organization_id uuid references public.organizations(id);
update public.projects set organization_id = user_id where organization_id is null;
update public.estimates set organization_id = user_id where organization_id is null;
update public.clients set organization_id = user_id where organization_id is null;
alter table public.projects alter column organization_id set not null;
alter table public.estimates alter column organization_id set not null;
alter table public.clients alter column organization_id set not null;

create or replace function private.normalize_owned_row_organization()
returns trigger language plpgsql security invoker set search_path = public, private
as $$
begin
  if new.organization_id is null then new.organization_id := new.user_id; end if;
  if current_user not in ('service_role', 'postgres')
     and tg_op = 'INSERT'
     and new.user_id is distinct from (select auth.uid()) then
    raise exception 'Invalid owner';
  end if;
  if current_user not in ('service_role', 'postgres')
     and tg_op = 'UPDATE'
     and new.user_id is distinct from old.user_id then
    raise exception 'Owner cannot be changed';
  end if;
  if current_user not in ('service_role', 'postgres') and not private.is_org_member(new.organization_id) then
    raise exception 'Organization access denied';
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_projects_organization on public.projects;
create trigger normalize_projects_organization before insert or update on public.projects
for each row execute function private.normalize_owned_row_organization();
drop trigger if exists normalize_estimates_organization on public.estimates;
create trigger normalize_estimates_organization before insert or update on public.estimates
for each row execute function private.normalize_owned_row_organization();
drop trigger if exists normalize_clients_organization on public.clients;
create trigger normalize_clients_organization before insert or update on public.clients
for each row execute function private.normalize_owned_row_organization();

create policy "Organization members read projects" on public.projects
for select to authenticated using (private.is_org_member(organization_id));
create policy "Organization members create projects" on public.projects
for insert to authenticated with check (private.is_org_member(organization_id) and user_id = (select auth.uid()));
create policy "Organization members update projects" on public.projects
for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "Organization members read estimates" on public.estimates
for select to authenticated using (private.is_org_member(organization_id));
create policy "Organization members read clients" on public.clients
for select to authenticated using (private.is_org_member(organization_id));

revoke all on public.organizations, public.organization_members from anon;
grant select, insert, update, delete on public.organizations, public.organization_members to authenticated;

-- ---------------------------------------------------------------------------
-- Entitlements and configurable AI routing
-- ---------------------------------------------------------------------------

create table if not exists public.feature_entitlements (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.subscription_tiers(id) on delete cascade,
  feature_key text not null check (feature_key ~ '^[a-z][a-z0-9_]{2,63}$'),
  enabled boolean not null default false,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tier_id, feature_key)
);

create table if not exists public.plan_ai_policies (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.subscription_tiers(id) on delete cascade,
  task_type text not null check (task_type in ('classification', 'quote_generation', 'quote_review', 'time_extraction', 'cost_analysis')),
  complexity_min smallint not null default 1 check (complexity_min between 1 and 3),
  complexity_max smallint not null default 3 check (complexity_max between 1 and 3 and complexity_max >= complexity_min),
  primary_model_id uuid not null references public.ai_models(id) on delete restrict,
  fallback_model_id uuid references public.ai_models(id) on delete set null,
  reasoning_effort text not null default 'low' check (reasoning_effort in ('none', 'minimal', 'low', 'medium', 'high')),
  max_output_tokens integer not null default 6000 check (max_output_tokens between 256 and 128000),
  priority integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tier_id, task_type, complexity_min, complexity_max, priority)
);

alter table public.feature_entitlements enable row level security;
alter table public.plan_ai_policies enable row level security;
create policy "Authenticated users read entitlements" on public.feature_entitlements
for select to authenticated using (true);
create policy "Admins manage entitlements" on public.feature_entitlements
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Authenticated users read AI policies" on public.plan_ai_policies
for select to authenticated using (enabled = true);
create policy "Admins manage AI policies" on public.plan_ai_policies
for all to authenticated using (is_admin()) with check (is_admin());

revoke all on public.feature_entitlements, public.plan_ai_policies from anon;
grant select on public.feature_entitlements, public.plan_ai_policies to authenticated;
grant insert, update, delete on public.feature_entitlements, public.plan_ai_policies to authenticated;

insert into public.ai_models (
  provider, model_id, display_name, description,
  cost_per_1k_tokens_input, cost_per_1k_tokens_output, max_tokens, capabilities, is_active
) values
  ('openrouter', 'openai/gpt-5.6-luna', 'GPT-5.6 Luna', 'Rapide et économique pour classification et devis simples', 0.0002, 0.0012, 128000, '{"json_mode":true,"structured_outputs":true,"reasoning":true}'::jsonb, true),
  ('openrouter', 'openai/gpt-5.6-terra', 'GPT-5.6 Terra', 'Équilibre coût/raisonnement pour dossiers multi-lots', 0.002, 0.012, 128000, '{"json_mode":true,"structured_outputs":true,"reasoning":true,"vision":true}'::jsonb, true),
  ('openrouter', 'openai/gpt-5.6-sol', 'GPT-5.6 Sol', 'Modèle supérieur réservé aux analyses complexes et critiques', 0.002, 0.010, 128000, '{"json_mode":true,"structured_outputs":true,"reasoning":true,"vision":true}'::jsonb, true)
on conflict (provider, model_id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  cost_per_1k_tokens_input = excluded.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = excluded.cost_per_1k_tokens_output,
  max_tokens = excluded.max_tokens,
  capabilities = excluded.capabilities,
  is_active = excluded.is_active;

with feature_matrix(tier_name, feature_key, enabled) as (values
  ('starter','auto_classification',true), ('starter','cost_engine_basic',true),
  ('starter','job_management',false), ('starter','team_management',false), ('starter','time_tracking',false), ('starter','purchase_tracking',false),
  ('business','auto_classification',true), ('business','cost_engine_basic',true),
  ('business','job_management',true), ('business','team_management',false), ('business','time_tracking',false), ('business','purchase_tracking',true),
  ('pro','auto_classification',true), ('pro','cost_engine_basic',true),
  ('pro','job_management',true), ('pro','team_management',true), ('pro','time_tracking',true), ('pro','purchase_tracking',true),
  ('pro','advanced_ai',true), ('pro','job_profitability',true), ('pro','historical_cost_learning',true)
)
insert into public.feature_entitlements(tier_id, feature_key, enabled)
select st.id, fm.feature_key, fm.enabled from feature_matrix fm
join public.subscription_tiers st on st.name = fm.tier_name
on conflict (tier_id, feature_key) do update set enabled = excluded.enabled, updated_at = now();

create or replace function private.has_entitlement(p_organization_id uuid, p_feature_key text)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select coalesce(bool_or(fe.enabled), false)
  from public.organizations o
  join public.user_subscriptions us on us.user_id = o.owner_user_id and us.status = 'active'
  join public.feature_entitlements fe on fe.tier_id = us.tier_id and fe.feature_key = p_feature_key
  where o.id = p_organization_id;
$$;

revoke all on function private.has_entitlement(uuid, text) from public, anon;
grant execute on function private.has_entitlement(uuid, text) to authenticated, service_role;

with policy_seed(tier_name, task_type, cmin, cmax, primary_slug, fallback_slug, effort, tokens, priority) as (values
  ('starter','classification',1,3,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','minimal',3000,10),
  ('starter','quote_generation',1,3,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','low',6000,10),
  ('starter','quote_review',1,3,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','low',4000,10),
  ('business','classification',1,3,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','minimal',3000,10),
  ('business','quote_generation',1,1,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','low',6000,10),
  ('business','quote_generation',2,3,'openai/gpt-5.6-terra','openai/gpt-5.6-luna','medium',8000,10),
  ('business','quote_review',1,3,'openai/gpt-5.6-terra','openai/gpt-5.6-luna','medium',6000,10),
  ('pro','classification',1,3,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','minimal',3000,10),
  ('pro','quote_generation',1,1,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','low',6000,10),
  ('pro','quote_generation',2,2,'openai/gpt-5.6-terra','openai/gpt-5.6-luna','medium',8000,10),
  ('pro','quote_generation',3,3,'openai/gpt-5.6-sol','openai/gpt-5.6-terra','high',12000,10),
  ('pro','quote_review',1,2,'openai/gpt-5.6-terra','openai/gpt-5.6-luna','medium',8000,10),
  ('pro','quote_review',3,3,'openai/gpt-5.6-sol','openai/gpt-5.6-terra','high',12000,10),
  ('pro','time_extraction',1,3,'openai/gpt-5.6-luna','openai/gpt-4.1-mini','minimal',2500,10),
  ('pro','cost_analysis',1,2,'openai/gpt-5.6-terra','openai/gpt-5.6-luna','medium',6000,10),
  ('pro','cost_analysis',3,3,'openai/gpt-5.6-sol','openai/gpt-5.6-terra','high',10000,10)
)
insert into public.plan_ai_policies(
  tier_id, task_type, complexity_min, complexity_max, primary_model_id, fallback_model_id,
  reasoning_effort, max_output_tokens, priority
)
select st.id, ps.task_type, ps.cmin, ps.cmax, primary_model.id, fallback_model.id,
       ps.effort, ps.tokens, ps.priority
from policy_seed ps
join public.subscription_tiers st on st.name = ps.tier_name
join public.ai_models primary_model on primary_model.provider = 'openrouter' and primary_model.model_id = ps.primary_slug
left join public.ai_models fallback_model on fallback_model.provider = 'openrouter' and fallback_model.model_id = ps.fallback_slug
on conflict (tier_id, task_type, complexity_min, complexity_max, priority) do update set
  primary_model_id = excluded.primary_model_id,
  fallback_model_id = excluded.fallback_model_id,
  reasoning_effort = excluded.reasoning_effort,
  max_output_tokens = excluded.max_output_tokens,
  enabled = true,
  updated_at = now();

create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  version integer not null check (version > 0),
  task_type text not null,
  system_prompt text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (prompt_key, version)
);
alter table public.prompt_templates enable row level security;
revoke all on public.prompt_templates from anon, authenticated;
grant select, insert, update, delete on public.prompt_templates to service_role;

insert into public.prompt_templates(prompt_key, version, task_type, system_prompt) values
  ('quote-classification', 1, 'classification', 'Extraire des données BTP structurées. Ne jamais calculer les montants financiers. Signaler les informations critiques manquantes.'),
  ('quote-generation', 1, 'quote_generation', 'Générer des postes BTP structurés à partir des faits confirmés. Les calculs sont effectués par l application.'),
  ('time-extraction', 1, 'time_extraction', 'Extraire salariés, chantiers, dates et durées. Ne jamais résoudre silencieusement une ambiguïté.')
on conflict (prompt_key, version) do nothing;

create table if not exists public.quote_classifications (
  project_id uuid primary key references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_type text not null,
  trades jsonb not null default '[]'::jsonb check (jsonb_typeof(trades) = 'array'),
  lots jsonb not null default '[]'::jsonb check (jsonb_typeof(lots) = 'array'),
  complexity smallint not null check (complexity between 1 and 3),
  detected_measurements jsonb not null default '[]'::jsonb,
  missing_critical_inputs jsonb not null default '[]'::jsonb,
  recommended_quote_structure jsonb not null default '[]'::jsonb,
  internal_template_id uuid references public.estimate_templates(id) on delete set null,
  vat_context text not null default 'to_verify',
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  prompt_version text not null default 'quote-classification-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quote_classifications enable row level security;
create policy "Members read quote classifications" on public.quote_classifications
for select to authenticated using (private.is_org_member(organization_id));
revoke all on public.quote_classifications from anon, authenticated;
grant select on public.quote_classifications to authenticated;
grant select, insert, update, delete on public.quote_classifications to service_role;

-- ---------------------------------------------------------------------------
-- Internal costs, jobs and actuals
-- ---------------------------------------------------------------------------

alter table public.estimates add column if not exists quote_status text not null default 'draft'
  check (quote_status in ('draft','sent','accepted','rejected','expired'));

create table if not exists public.quote_cost_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  line_key text not null,
  category text not null default 'other' check (category in ('material','labor','subcontract','equipment','transport','consumable','other')),
  description text not null,
  quantity numeric(14,3) not null default 1 check (quantity >= 0),
  unit text not null default 'forfait',
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  planned_minutes integer not null default 0 check (planned_minutes >= 0),
  hourly_cost_cents integer not null default 0 check (hourly_cost_cents >= 0),
  other_cost_cents bigint not null default 0 check (other_cost_cents >= 0),
  sale_price_cents bigint not null default 0 check (sale_price_cents >= 0),
  supplier text,
  price_observed_on date,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estimate_id, line_key)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_estimate_id uuid not null unique references public.estimates(id) on delete restrict,
  source_project_id uuid not null references public.projects(id) on delete restrict,
  name text not null,
  client_name text,
  address text,
  status text not null default 'planned' check (status in ('planned','active','paused','completed','cancelled')),
  sold_total_ht_cents bigint not null default 0 check (sold_total_ht_cents >= 0),
  initial_budget_cents bigint not null default 0 check (initial_budget_cents >= 0),
  started_on date,
  completed_on date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.sync_quote_cost_items_from_estimate()
returns trigger language plpgsql security definer set search_path = public, private
as $$
declare
  v_category record;
  v_item record;
  v_material_cents bigint;
  v_labor_cents bigint;
  v_sale_cents bigint;
  v_description text;
begin
  if new.estimate_kind <> 'quote' then return new; end if;
  delete from public.quote_cost_items where estimate_id = new.id;

  for v_category in
    select value, ordinality from jsonb_array_elements(coalesce(new.categories, '[]'::jsonb)) with ordinality
  loop
    for v_item in
      select value, ordinality from jsonb_array_elements(coalesce(v_category.value->'items', '[]'::jsonb)) with ordinality
    loop
      v_material_cents := case when jsonb_typeof(v_item.value->'materials_cost') = 'number'
        then greatest(round((v_item.value->>'materials_cost')::numeric * 100)::bigint, 0) else 0 end;
      v_labor_cents := case when jsonb_typeof(v_item.value->'labor_cost') = 'number'
        then greatest(round((v_item.value->>'labor_cost')::numeric * 100)::bigint, 0) else 0 end;
      v_sale_cents := case when jsonb_typeof(v_item.value->'amount_ht') = 'number'
        then greatest(round((v_item.value->>'amount_ht')::numeric * 100)::bigint, 0) else 0 end;
      v_description := left(coalesce(nullif(v_item.value->>'poste', ''), 'Poste sans nom'), 500);

      if v_material_cents > 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, quantity,
          unit, unit_cost_cents, sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_category.ordinality || '-' || v_item.ordinality || '-material',
          'material', v_description, 1, 'forfait', v_material_cents, v_sale_cents, 'estimate'
        );
      end if;
      if v_labor_cents > 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, planned_minutes,
          hourly_cost_cents, sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_category.ordinality || '-' || v_item.ordinality || '-labor',
          'labor', v_description, 60, v_labor_cents, case when v_material_cents = 0 then v_sale_cents else 0 end, 'estimate'
        );
      end if;
      if v_material_cents = 0 and v_labor_cents = 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, other_cost_cents,
          sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_category.ordinality || '-' || v_item.ordinality || '-unallocated',
          'other', v_description, 0, v_sale_cents, 'estimate-unallocated'
        );
      end if;
    end loop;
  end loop;
  return new;
end;
$$;

drop trigger if exists sync_quote_cost_items_from_estimate on public.estimates;
create trigger sync_quote_cost_items_from_estimate
after insert or update of categories, estimate_kind, organization_id on public.estimates
for each row execute function private.sync_quote_cost_items_from_estimate();

-- Seed internal cost lines for existing reviewed quotes without altering their
-- commercial amounts. The normalization trigger explicitly permits postgres.
update public.estimates set categories = categories where estimate_kind = 'quote';

create table if not exists public.job_budget_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  sold_total_ht_cents bigint not null,
  material_cents bigint not null default 0,
  labor_cents bigint not null default 0,
  subcontract_cents bigint not null default 0,
  equipment_cents bigint not null default 0,
  other_cents bigint not null default 0,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_id, version)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  job_title text,
  status text not null default 'active' check (status in ('active','inactive')),
  gross_monthly_salary_cents integer check (gross_monthly_salary_cents >= 0),
  employer_monthly_cost_cents integer check (employer_monthly_cost_cents >= 0),
  contracted_weekly_minutes integer check (contracted_weekly_minutes between 1 and 10080),
  direct_hourly_cost_cents integer check (direct_hourly_cost_cents >= 0),
  hourly_cost_is_estimated boolean not null default true,
  meal_allowance_cents integer not null default 0 check (meal_allowance_cents >= 0),
  transport_allowance_cents integer not null default 0 check (transport_allowance_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete cascade,
  work_date date not null,
  minutes integer not null check (minutes between 1 and 1440),
  hourly_cost_cents_snapshot integer not null check (hourly_cost_cents_snapshot >= 0),
  source text not null default 'manual' check (source in ('manual','voice','import')),
  notes text check (char_length(notes) <= 1000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_cost_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  category text not null check (category in ('material','subcontract','equipment','transport','consumable','other')),
  supplier text,
  description text not null,
  quantity numeric(14,3) not null default 1 check (quantity > 0),
  amount_ht_cents bigint not null check (amount_ht_cents >= 0),
  vat_basis_points integer check (vat_basis_points between 0 and 10000),
  incurred_on date not null default current_date,
  source text not null default 'manual' check (source in ('manual','invoice','import')),
  document_path text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_cost_items_estimate_idx on public.quote_cost_items(estimate_id);
create index if not exists jobs_organization_status_idx on public.jobs(organization_id, status);
create index if not exists employees_organization_status_idx on public.employees(organization_id, status);
create index if not exists time_entries_job_date_idx on public.time_entries(job_id, work_date);
create index if not exists time_entries_employee_date_idx on public.time_entries(employee_id, work_date);
create index if not exists job_cost_entries_job_date_idx on public.job_cost_entries(job_id, incurred_on);

alter table public.quote_cost_items enable row level security;
alter table public.jobs enable row level security;
alter table public.job_budget_snapshots enable row level security;
alter table public.employees enable row level security;
alter table public.time_entries enable row level security;
alter table public.job_cost_entries enable row level security;

create policy "Members read quote internal costs" on public.quote_cost_items for select to authenticated using (private.is_org_member(organization_id) and private.has_entitlement(organization_id, 'cost_engine_basic'));
create policy "Admins manage quote internal costs" on public.quote_cost_items for all to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "Members read jobs" on public.jobs for select to authenticated using (private.is_org_member(organization_id) and private.has_entitlement(organization_id, 'job_management'));
create policy "Admins manage jobs" on public.jobs for all to authenticated using (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'job_management')) with check (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'job_management'));
create policy "Members read budget snapshots" on public.job_budget_snapshots for select to authenticated using (private.is_org_member(organization_id) and private.has_entitlement(organization_id, 'job_management'));
create policy "Admins create budget snapshots" on public.job_budget_snapshots for insert to authenticated with check (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'job_management'));
create policy "Admins read employees" on public.employees for select to authenticated using (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'team_management'));
create policy "Admins manage employees" on public.employees for all to authenticated using (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'team_management')) with check (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'team_management'));
create policy "Members read time entries" on public.time_entries for select to authenticated using (private.is_org_member(organization_id) and private.has_entitlement(organization_id, 'time_tracking'));
create policy "Admins manage time entries" on public.time_entries for all to authenticated using (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'time_tracking')) with check (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'time_tracking'));
create policy "Members read job costs" on public.job_cost_entries for select to authenticated using (private.is_org_member(organization_id) and private.has_entitlement(organization_id, 'purchase_tracking'));
create policy "Admins manage job costs" on public.job_cost_entries for all to authenticated using (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'purchase_tracking')) with check (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'purchase_tracking'));

revoke all on public.quote_cost_items, public.jobs, public.job_budget_snapshots,
  public.employees, public.time_entries, public.job_cost_entries from anon;
grant select, insert, update, delete on public.quote_cost_items, public.jobs,
  public.job_budget_snapshots, public.employees, public.time_entries,
  public.job_cost_entries to authenticated;

alter table public.api_usage_logs add column if not exists organization_id uuid references public.organizations(id);
alter table public.api_usage_logs add column if not exists task_type text;
alter table public.api_usage_logs add column if not exists plan_name text;
alter table public.api_usage_logs add column if not exists provider text;
alter table public.api_usage_logs add column if not exists fallback_used boolean not null default false;
alter table public.api_usage_logs add column if not exists prompt_version text;
update public.api_usage_logs set organization_id = user_id where organization_id is null;

create or replace function public.accept_estimate_and_create_job(p_estimate_id uuid)
returns uuid language plpgsql security definer set search_path = public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_estimate public.estimates;
  v_project public.projects;
  v_job_id uuid;
  v_material bigint := 0;
  v_labor bigint := 0;
  v_subcontract bigint := 0;
  v_equipment bigint := 0;
  v_other bigint := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_estimate from public.estimates
    where id = p_estimate_id and estimate_kind = 'quote' for update;
  if v_estimate.id is null
     or not private.is_org_admin(v_estimate.organization_id)
     or not private.has_entitlement(v_estimate.organization_id, 'job_management') then
    raise exception 'Estimate not found';
  end if;
  select * into v_project from public.projects where id = v_estimate.project_id;

  select
    coalesce(sum(case when category = 'material' then round(quantity * unit_cost_cents)::bigint else 0 end),0),
    coalesce(sum(case when category = 'labor' then round(planned_minutes * hourly_cost_cents / 60.0)::bigint else 0 end),0),
    coalesce(sum(case when category = 'subcontract' then other_cost_cents else 0 end),0),
    coalesce(sum(case when category = 'equipment' then other_cost_cents else 0 end),0),
    coalesce(sum(case when category in ('transport','consumable','other') then other_cost_cents else 0 end),0)
  into v_material, v_labor, v_subcontract, v_equipment, v_other
  from public.quote_cost_items where estimate_id = v_estimate.id;

  insert into public.jobs(
    organization_id, source_estimate_id, source_project_id, name, client_name, address,
    sold_total_ht_cents, initial_budget_cents, created_by
  ) values (
    v_estimate.organization_id, v_estimate.id, v_project.id, v_project.title,
    coalesce(v_estimate.client_name, v_project.client_name), v_project.client_address,
    round(coalesce(v_estimate.total_ht,0) * 100)::bigint,
    v_material + v_labor + v_subcontract + v_equipment + v_other, v_user_id
  )
  on conflict (source_estimate_id) do update set updated_at = now()
  returning id into v_job_id;

  insert into public.job_budget_snapshots(
    organization_id, job_id, version, sold_total_ht_cents, material_cents, labor_cents,
    subcontract_cents, equipment_cents, other_cents, source_payload
  ) values (
    v_estimate.organization_id, v_job_id, 1, round(coalesce(v_estimate.total_ht,0) * 100)::bigint,
    v_material, v_labor, v_subcontract, v_equipment, v_other,
    jsonb_build_object('estimate_id', v_estimate.id, 'captured_at', now())
  ) on conflict (job_id, version) do nothing;

  update public.estimates set quote_status = 'accepted' where id = v_estimate.id;
  return v_job_id;
end;
$$;

revoke all on function public.accept_estimate_and_create_job(uuid) from public, anon;
grant execute on function public.accept_estimate_and_create_job(uuid) to authenticated;
