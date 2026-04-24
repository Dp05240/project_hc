-- ============================================================
-- 1. Migrate existing 'builder' values → 'property_manager' FIRST
-- ============================================================
update public.profiles set role = 'property_manager' where role = 'builder';

-- ============================================================
-- 2. Now swap the check constraint (no old values remain)
-- ============================================================
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('property_manager', 'inspector', 'contractor'));

-- ============================================================
-- 3. work_orders table
-- ============================================================
create table if not exists public.work_orders (
  id            uuid primary key default gen_random_uuid(),
  work_order_id text not null unique,
  plo_id        uuid not null references public.plos(id) on delete cascade,
  status        text not null default 'Open'
                  check (status in ('Open', 'In Progress', 'Closed')),
  created_at    timestamptz not null default now()
);

alter table public.work_orders enable row level security;

-- Property managers can do everything; contractors read-only
create policy "pm_all_work_orders" on public.work_orders
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'property_manager'
    )
  );

create policy "contractor_read_work_orders" on public.work_orders
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'contractor'
    )
  );

-- ============================================================
-- 4. Function + trigger: auto-create work order on PLO → Under Review
-- ============================================================
create or replace function public.auto_create_work_order()
returns trigger language plpgsql security definer as $$
declare
  v_year  text;
  v_max   integer;
  v_next  integer;
  v_wo_id text;
begin
  if new.status = 'Under Review' and (old.status is distinct from 'Under Review') then
    v_year := to_char(now(), 'YYYY');
    select coalesce(max(
      cast(
        nullif(regexp_replace(work_order_id, '^WO-' || v_year || '-', ''), '') as integer
      )
    ), 0)
    into v_max
    from public.work_orders
    where work_order_id like 'WO-' || v_year || '-%';

    v_next := v_max + 1;
    v_wo_id := 'WO-' || v_year || '-' || lpad(v_next::text, 3, '0');

    -- Only create if one doesn't already exist for this PLO
    if not exists (select 1 from public.work_orders where plo_id = new.id) then
      insert into public.work_orders (work_order_id, plo_id, status)
      values (v_wo_id, new.id, 'Open');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_work_order on public.plos;

create trigger trg_auto_work_order
  after update of status on public.plos
  for each row execute function public.auto_create_work_order();
