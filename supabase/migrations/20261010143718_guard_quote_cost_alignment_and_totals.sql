-- A manual cost override belongs to a quote line, not to its current array
-- position. Existing quote lines retain their old positional key on first edit;
-- newly added lines receive a stable client-generated key.
create or replace function private.sync_quote_cost_items_from_estimate()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_category record;
  v_item record;
  v_manual record;
  v_key text;
  v_base_key text;
  v_line_map jsonb := '{}'::jsonb;
  v_kind text;
  v_material_cents bigint;
  v_labor_cents bigint;
  v_sale_cents bigint;
  v_description text;
begin
  if new.estimate_kind <> 'quote' then return new; end if;

  -- Check all line identities before touching any generated or manual cost.
  for v_category in
    select value, ordinality from jsonb_array_elements(coalesce(new.categories, '[]'::jsonb)) with ordinality
  loop
    for v_item in
      select value, ordinality from jsonb_array_elements(coalesce(v_category.value->'items', '[]'::jsonb)) with ordinality
    loop
      v_key := coalesce(nullif(v_item.value->>'cost_line_key', ''),
        v_category.ordinality::text || '-' || v_item.ordinality::text);
      if v_key !~ '^[A-Za-z0-9-]{1,64}$' or v_line_map ? v_key then
        raise exception using errcode = '23514', message = 'Duplicate or invalid quote cost line key';
      end if;
      v_line_map := v_line_map || jsonb_build_object(v_key,
        jsonb_build_object(
          'poste', coalesce(v_item.value->>'poste', ''),
          'explicit', v_item.value ? 'cost_line_key',
          'material', coalesce((v_item.value->>'materials_cost')::numeric, 0) > 0,
          'labor', coalesce((v_item.value->>'labor_cost')::numeric, 0) > 0
        ));
    end loop;
  end loop;

  -- A direct API update without stable keys must never silently reassign or
  -- duplicate an existing manual override when the array positions move.
  for v_manual in
    select line_key, description from public.quote_cost_items
    where estimate_id = new.id and source = 'manual'
      and line_key ~ '^([0-9]+-[0-9]+|new-[0-9a-f-]+)-(material|labor|unallocated)$'
  loop
    v_base_key := regexp_replace(v_manual.line_key, '-(material|labor|unallocated)$', '');
    v_kind := substring(v_manual.line_key from '(material|labor|unallocated)$');
    if not (v_line_map ? v_base_key)
       or (tg_op = 'UPDATE' and new.categories is distinct from old.categories
           and coalesce((v_line_map->v_base_key->>'explicit')::boolean, false) = false)
       or ((v_line_map->v_base_key->>'explicit')::boolean = false
           and v_line_map->v_base_key->>'poste' is distinct from v_manual.description)
       or (v_kind = 'material' and coalesce((v_line_map->v_base_key->>'material')::boolean, false) = false)
       or (v_kind = 'labor' and coalesce((v_line_map->v_base_key->>'labor')::boolean, false) = false)
       or (v_kind = 'unallocated' and (
            coalesce((v_line_map->v_base_key->>'material')::boolean, false)
            or coalesce((v_line_map->v_base_key->>'labor')::boolean, false))) then
      raise exception using errcode = '23514',
        message = 'Manual quote cost would lose its source line; retain its line key or adjust the override first';
    end if;
  end loop;

  delete from public.quote_cost_items
    where estimate_id = new.id and source in ('estimate', 'estimate-unallocated');

  for v_category in
    select value, ordinality from jsonb_array_elements(coalesce(new.categories, '[]'::jsonb)) with ordinality
  loop
    for v_item in
      select value, ordinality from jsonb_array_elements(coalesce(v_category.value->'items', '[]'::jsonb)) with ordinality
    loop
      v_key := coalesce(nullif(v_item.value->>'cost_line_key', ''),
        v_category.ordinality::text || '-' || v_item.ordinality::text);
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
          new.organization_id, new.id, v_key || '-material',
          'material', v_description, 1, 'forfait', v_material_cents, v_sale_cents, 'estimate'
        ) on conflict (estimate_id, line_key) do nothing;
      end if;
      if v_labor_cents > 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, planned_minutes,
          hourly_cost_cents, sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_key || '-labor',
          'labor', v_description, 60, v_labor_cents,
          case when v_material_cents = 0 then v_sale_cents else 0 end, 'estimate'
        ) on conflict (estimate_id, line_key) do nothing;
      end if;
      if v_material_cents = 0 and v_labor_cents = 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, other_cost_cents,
          sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_key || '-unallocated',
          'other', v_description, 0, v_sale_cents, 'estimate-unallocated'
        ) on conflict (estimate_id, line_key) do nothing;
      end if;
    end loop;
  end loop;
  return new;
end;
$$;
revoke all on function private.sync_quote_cost_items_from_estimate() from public, anon, authenticated;

-- The browser computes totals for responsiveness, but authenticated callers
-- cannot be allowed to persist inconsistent quote money via direct Data API calls.
create or replace function private.validate_authenticated_quote_totals()
returns trigger language plpgsql set search_path = ''
as $$
declare
  v_category jsonb;
  v_item jsonb;
  v_quantity numeric;
  v_price numeric;
  v_rate numeric;
  v_line_ht numeric;
  v_line_vat numeric;
  v_line_ttc numeric;
  v_category_ht numeric;
  v_category_vat numeric;
  v_category_ttc numeric;
  v_total_ht numeric := 0;
  v_total_vat numeric := 0;
  v_total_ttc numeric := 0;
  v_discount_percent numeric;
  v_discount_amount numeric;
begin
  if current_user <> 'authenticated' or new.estimate_kind <> 'quote' then return new; end if;
  if new.quote_status <> 'draft' or jsonb_typeof(new.categories) is distinct from 'array'
     or jsonb_array_length(new.categories) = 0 then
    raise exception using errcode = '23514', message = 'Only complete draft quotes may be edited';
  end if;
  for v_category in select value from jsonb_array_elements(new.categories)
  loop
    if jsonb_typeof(v_category->'items') is distinct from 'array' or jsonb_array_length(v_category->'items') = 0 then
      raise exception using errcode = '23514', message = 'Quote category has no lines';
    end if;
    v_category_ht := 0; v_category_vat := 0; v_category_ttc := 0;
    for v_item in select value from jsonb_array_elements(v_category->'items')
    loop
      if jsonb_typeof(v_item->'quantity') is distinct from 'number'
         or jsonb_typeof(v_item->'unit_price_ht') is distinct from 'number'
         or jsonb_typeof(v_item->'tva_percent') is distinct from 'number'
         or jsonb_typeof(v_item->'amount_ht') is distinct from 'number'
         or jsonb_typeof(v_item->'tva_amount') is distinct from 'number'
         or jsonb_typeof(v_item->'amount_ttc') is distinct from 'number' then
        raise exception using errcode = '23514', message = 'Quote line amounts are incomplete';
      end if;
      v_quantity := (v_item->>'quantity')::numeric;
      v_price := (v_item->>'unit_price_ht')::numeric;
      v_rate := (v_item->>'tva_percent')::numeric;
      if v_quantity <= 0 or v_price < 0 or v_rate < 0 or v_rate > 100 then
        raise exception using errcode = '23514', message = 'Quote line price or VAT is invalid';
      end if;
      v_line_ht := round(v_quantity * v_price, 2);
      v_line_vat := round(v_line_ht * v_rate / 100, 2);
      v_line_ttc := v_line_ht + v_line_vat;
      if (v_item->>'amount_ht')::numeric <> v_line_ht
         or (v_item->>'tva_amount')::numeric <> v_line_vat
         or (v_item->>'amount_ttc')::numeric <> v_line_ttc then
        raise exception using errcode = '23514', message = 'Quote line amounts do not match quantity, price and VAT';
      end if;
      v_category_ht := v_category_ht + v_line_ht;
      v_category_vat := v_category_vat + v_line_vat;
      v_category_ttc := v_category_ttc + v_line_ttc;
    end loop;
    if (v_category->>'subtotal_ht')::numeric is distinct from v_category_ht
       or (v_category->>'subtotal_tva')::numeric is distinct from v_category_vat
       or (v_category->>'subtotal_ttc')::numeric is distinct from v_category_ttc then
      raise exception using errcode = '23514', message = 'Quote category subtotals do not match its lines';
    end if;
    v_total_ht := v_total_ht + v_category_ht;
    v_total_vat := v_total_vat + v_category_vat;
    v_total_ttc := v_total_ttc + v_category_ttc;
  end loop;
  if new.total_ht is distinct from v_total_ht
     or new.total_tva is distinct from v_total_vat
     or new.total_ttc is distinct from v_total_ttc
     or new.total_amount is distinct from v_total_ttc then
    raise exception using errcode = '23514', message = 'Quote totals do not match its lines';
  end if;
  v_discount_percent := coalesce(new.discount_percent, 0);
  v_discount_amount := coalesce(new.discount_amount, 0);
  if v_discount_percent < 0 or v_discount_percent > 100
     or v_discount_amount < 0 or v_discount_amount > v_total_ttc
     or (v_discount_percent > 0
         and v_discount_amount <> round(v_total_ttc * v_discount_percent / 100, 2))
     or coalesce(new.deposit_required, 0) < 0
     or coalesce(new.deposit_required, 0) > 100 then
    raise exception using errcode = '23514', message = 'Quote discount or deposit is invalid';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_authenticated_quote_totals() from public, anon, authenticated;
drop trigger if exists validate_authenticated_quote_totals on public.estimates;
create trigger validate_authenticated_quote_totals
  before insert or update of categories, total_ht, total_tva, total_ttc, total_amount,
    discount_percent, discount_amount, deposit_required
  on public.estimates
  for each row execute function private.validate_authenticated_quote_totals();

-- A declined or expired quote cannot later become a signed job through the
-- existing accept RPC. Sent and draft quotes keep their existing acceptance path.
create or replace function private.prevent_terminal_quote_acceptance()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.estimate_kind = 'quote' and old.quote_status in ('rejected', 'expired')
     and new.quote_status = 'accepted' then
    raise exception using errcode = '23514', message = 'Rejected or expired quotes cannot be accepted';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_terminal_quote_acceptance() from public, anon, authenticated;
drop trigger if exists prevent_terminal_quote_acceptance on public.estimates;
create trigger prevent_terminal_quote_acceptance
  before update of quote_status on public.estimates
  for each row execute function private.prevent_terminal_quote_acceptance();
