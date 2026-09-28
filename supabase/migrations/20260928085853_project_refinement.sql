-- Draft refinement is separate from estimates: no quote is created by answering questions.
-- The live Devisia database predates the repository's consolidated base schema.
alter table public.estimates add column if not exists estimate_data jsonb not null default '{}'::jsonb;
alter table public.estimates add column if not exists estimate_kind text not null default 'quote'
  check (estimate_kind in ('quote', 'preliminary'));

-- The composite FK prevents a service process from attaching another user's project.
create unique index if not exists projects_id_user_id_unique on public.projects(id, user_id);

create table if not exists public.project_refinements (
  project_id uuid primary key references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  status text not null default 'DISCOVERY' check (status in ('DISCOVERY', 'REFINEMENT', 'ESTIMATE')),
  facts jsonb not null default '[]'::jsonb check (jsonb_typeof(facts) = 'array'),
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_refinements_owner_fk foreign key (project_id, user_id)
    references public.projects(id, user_id) on delete cascade
);

create table if not exists public.project_refinement_revisions (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  primary key (project_id, version),
  constraint project_refinement_revisions_owner_fk foreign key (project_id, user_id)
    references public.projects(id, user_id) on delete cascade
);

create index if not exists project_refinement_revisions_user_idx
  on public.project_refinement_revisions(user_id, created_at desc);

alter table public.project_refinements enable row level security;
alter table public.project_refinement_revisions enable row level security;

revoke all on public.project_refinements from anon, authenticated;
revoke all on public.project_refinement_revisions from anon, authenticated;
grant select on public.project_refinements to authenticated;
grant select on public.project_refinement_revisions to authenticated;
grant select, insert, update, delete on public.project_refinements to service_role;
grant select, insert, update, delete on public.project_refinement_revisions to service_role;

create policy "Owner reads refinement" on public.project_refinements
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner reads refinement history" on public.project_refinement_revisions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Only the authenticated Edge Function writes; this function gives one atomic
-- compare-and-swap update with an append-only snapshot for every version.
create or replace function public.save_project_refinement(
  p_project_id uuid, p_user_id uuid, p_expected_version integer,
  p_status text, p_facts jsonb, p_questions jsonb
) returns public.project_refinements
language plpgsql security invoker set search_path = public
as $$
declare result public.project_refinements;
begin
  if p_status not in ('DISCOVERY', 'REFINEMENT', 'ESTIMATE')
     or jsonb_typeof(p_facts) is distinct from 'array'
     or jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Invalid refinement payload';
  end if;

  if p_expected_version = 0 then
    insert into public.project_refinements(project_id, user_id, version, status, facts, questions)
    values (p_project_id, p_user_id, 1, p_status, p_facts, p_questions)
    on conflict do nothing returning * into result;
  else
    update public.project_refinements
    set version = version + 1, status = p_status, facts = p_facts,
        questions = p_questions, updated_at = now()
    where project_id = p_project_id and user_id = p_user_id
      and version = p_expected_version returning * into result;
  end if;

  if result.project_id is null then
    raise exception 'REFINEMENT_CONFLICT';
  end if;

  insert into public.project_refinement_revisions(project_id, user_id, version, snapshot)
  values (result.project_id, result.user_id, result.version,
    jsonb_build_object('status', result.status, 'facts', result.facts, 'questions', result.questions));
  return result;
end;
$$;

revoke all on function public.save_project_refinement(uuid, uuid, integer, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_project_refinement(uuid, uuid, integer, text, jsonb, jsonb) to service_role;
