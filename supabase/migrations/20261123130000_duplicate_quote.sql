-- Copies are editable drafts alongside the active scenarios, in the same project.
alter table public.estimates
  add column quote_title text check (char_length(btrim(quote_title)) between 1 and 160),
  add column duplicate_source_id uuid;

grant update (quote_title) on public.estimates to authenticated;
grant select (quote_title, duplicate_source_id) on public.estimates to authenticated;
grant insert (
  id, project_id, user_id, organization_id, estimate_kind, quote_status, scenario_type,
  is_active, estimate_number, quote_title, duplicate_source_id, categories,
  total_ht, total_tva, total_ttc, total_amount, discount_percent, discount_amount,
  client_name, validity_days, payment_terms, execution_delay, deposit_required, special_conditions
) on public.estimates to authenticated;

create policy "Admins insert duplicated quotes" on public.estimates
  for insert to authenticated with check (duplicate_source_id is not null);

-- Existing permissive INSERT policies must also respect this boundary when a
-- row claims to be a duplicate. Other legacy INSERTs retain their own checks.
create policy "Protect duplicate quote source" on public.estimates
  as restrictive for insert to authenticated
  with check (
    duplicate_source_id is null or (
      user_id = (select auth.uid())
      and estimate_kind = 'quote' and quote_status = 'draft' and not is_active
      and private.is_org_admin(organization_id)
      and exists (
        select 1 from public.estimates source
        where source.id = estimates.duplicate_source_id
          and source.organization_id = estimates.organization_id
          and source.project_id = estimates.project_id
          and source.estimate_kind = 'quote'
      )
    )
  );

create function public.duplicate_quote(p_source_id uuid, p_title text, p_copy_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_title text := btrim(p_title);
  v_source record;
  v_existing record;
  v_category record;
  v_item record;
  v_cost public.quote_cost_items;
  v_categories jsonb := '[]'::jsonb;
  v_items jsonb;
  v_key_map jsonb := '{}'::jsonb;
  v_old_key text;
  v_new_key text;
  v_cost_base text;
  v_cost_suffix text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_source_id is null or p_copy_id is null or p_copy_id = p_source_id
     or v_title is null or char_length(v_title) not between 1 and 160 then
    raise exception using errcode = '22023', message = 'Invalid quote duplication request';
  end if;

  -- All reads and writes retain the caller's RLS. Match both sides of the
  -- project relationship, including when the caller belongs to several tenants.
  -- The commercial fields and manual rows are read in the same SQL snapshot.
  select e.*, p.client_name as project_client_name,
         coalesce((select jsonb_agg(to_jsonb(c))
                   from public.quote_cost_items c
                   where c.estimate_id = e.id and c.organization_id = e.organization_id
                     and (c.source is null or c.source not in ('estimate', 'estimate-unallocated'))), '[]') as manual_costs
  into v_source
  from public.estimates e
  join public.projects p on p.id = e.project_id and p.organization_id = e.organization_id
  where e.id = p_source_id and e.estimate_kind = 'quote'
    and private.is_org_admin(e.organization_id);
  if not found then
    raise exception using errcode = '42501', message = 'Quote not found or access denied';
  end if;

  -- Serialize retries of the same request without blocking other copies.
  perform pg_advisory_xact_lock(hashtextextended(p_copy_id::text, 0));
  select id, project_id, organization_id, user_id, duplicate_source_id, quote_title
  into v_existing from public.estimates where id = p_copy_id;
  if found then
    if v_existing.user_id = v_user_id and v_existing.organization_id = v_source.organization_id
       and v_existing.project_id = v_source.project_id and v_existing.duplicate_source_id = p_source_id
       and v_existing.quote_title = v_title then
      return p_copy_id;
    end if;
    raise exception using errcode = '23505', message = 'Quote duplication request already used';
  end if;

  if jsonb_typeof(v_source.categories) is distinct from 'array' then
    raise exception using errcode = '23514', message = 'Source quote has no valid categories';
  end if;
  for v_category in select value, ordinality from jsonb_array_elements(v_source.categories) with ordinality
  loop
    if jsonb_typeof(v_category.value->'items') is distinct from 'array' then
      raise exception using errcode = '23514', message = 'Source quote has no valid lines';
    end if;
    v_items := '[]'::jsonb;
    for v_item in select value, ordinality from jsonb_array_elements(v_category.value->'items') with ordinality
    loop
      v_old_key := coalesce(nullif(v_item.value->>'cost_line_key', ''),
        v_category.ordinality::text || '-' || v_item.ordinality::text);
      if v_key_map ? v_old_key then
        raise exception using errcode = '23514', message = 'Source quote has duplicate line keys';
      end if;
      v_new_key := 'new-' || gen_random_uuid()::text;
      v_key_map := v_key_map || jsonb_build_object(v_old_key, v_new_key);
      -- Copy business fields only. UUIDs and other embedded source metadata
      -- do not belong to the new commercial document.
      v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'cost_line_key', v_new_key, 'poste', v_item.value->'poste',
        'description', v_item.value->'description', 'quantity', v_item.value->'quantity',
        'unit', v_item.value->'unit', 'unit_price_ht', v_item.value->'unit_price_ht',
        'amount_ht', v_item.value->'amount_ht', 'tva_percent', v_item.value->'tva_percent',
        'tva_amount', v_item.value->'tva_amount', 'amount_ttc', v_item.value->'amount_ttc',
        'materials_cost', v_item.value->'materials_cost', 'labor_cost', v_item.value->'labor_cost',
        'cost_price', v_item.value->'cost_price', 'sell_price', v_item.value->'sell_price'
      )));
    end loop;
    v_categories := v_categories || jsonb_build_array(jsonb_build_object(
      'name', v_category.value->'name', 'description', v_category.value->'description', 'items', v_items,
      'subtotal_ht', v_category.value->'subtotal_ht', 'subtotal_tva', v_category.value->'subtotal_tva',
      'subtotal_ttc', v_category.value->'subtotal_ttc'
    ));
  end loop;

  -- Existing triggers validate the exact stored amounts and generate normal
  -- cost rows. Keep the source scenario active or inactive as it was.
  insert into public.estimates (
    id, project_id, user_id, organization_id, estimate_kind, quote_status, scenario_type,
    is_active, estimate_number, quote_title, duplicate_source_id, categories,
    total_ht, total_tva, total_ttc, total_amount, discount_percent, discount_amount,
    client_name, validity_days, payment_terms, execution_delay, deposit_required, special_conditions
  ) values (
    p_copy_id, v_source.project_id, v_user_id, v_source.organization_id, 'quote', 'draft', v_source.scenario_type,
    false, 'DEVIS-' || floor(extract(epoch from statement_timestamp()) * 1000)::bigint || '-' || p_copy_id::text,
    v_title, p_source_id, v_categories,
    v_source.total_ht, v_source.total_tva, v_source.total_ttc, v_source.total_amount,
    v_source.discount_percent, v_source.discount_amount,
    coalesce(nullif(v_source.client_name, ''), v_source.project_client_name),
    v_source.validity_days, v_source.payment_terms, v_source.execution_delay,
    v_source.deposit_required, v_source.special_conditions
  );

  for v_cost in select * from jsonb_populate_recordset(null::public.quote_cost_items, v_source.manual_costs)
  loop
    v_cost_suffix := substring(v_cost.line_key from '(-(?:material|labor|unallocated))$');
    v_cost_base := left(v_cost.line_key, -length(v_cost_suffix));
    if v_key_map ? v_cost_base then
      v_new_key := (v_key_map->>v_cost_base) || v_cost_suffix;
      if not exists (select 1 from public.quote_cost_items where estimate_id = p_copy_id and line_key = v_new_key) then
        raise exception using errcode = '23514', message = 'Source quote has a manual cost without its line component';
      end if;
    elsif v_cost.line_key ~ '^([0-9]+-[0-9]+|new-[0-9a-f-]+)-(material|labor|unallocated)$' then
      raise exception using errcode = '23514', message = 'Source quote has a manual cost without its line';
    else
      v_new_key := 'manual-' || gen_random_uuid()::text;
    end if;

    -- Overlay the generated counterpart by key, or insert a standalone cost.
    insert into public.quote_cost_items (
      organization_id, estimate_id, line_key, category, description, quantity, unit,
      unit_cost_cents, planned_minutes, hourly_cost_cents, other_cost_cents,
      sale_price_cents, supplier, price_observed_on, source
    ) values (
      v_source.organization_id, p_copy_id, v_new_key, v_cost.category, v_cost.description, v_cost.quantity,
      v_cost.unit, v_cost.unit_cost_cents, v_cost.planned_minutes, v_cost.hourly_cost_cents,
      v_cost.other_cost_cents, v_cost.sale_price_cents, v_cost.supplier, v_cost.price_observed_on, 'manual'
    ) on conflict (estimate_id, line_key) do update set
      category = excluded.category, description = excluded.description,
      quantity = excluded.quantity, unit = excluded.unit, unit_cost_cents = excluded.unit_cost_cents,
      planned_minutes = excluded.planned_minutes, hourly_cost_cents = excluded.hourly_cost_cents,
      other_cost_cents = excluded.other_cost_cents, sale_price_cents = excluded.sale_price_cents,
      supplier = excluded.supplier, price_observed_on = excluded.price_observed_on, source = excluded.source;
  end loop;

  return p_copy_id;
end;
$$;

revoke all on function public.duplicate_quote(uuid, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.duplicate_quote(uuid, text, uuid) to authenticated;
notify pgrst, 'reload schema';
