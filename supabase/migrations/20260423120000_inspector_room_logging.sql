-- Inspector lined logging: room completion map + stable line ordering per room.
-- Apply in Supabase SQL editor or via `supabase db push`.

alter table public.plos
  add column if not exists rooms_completed jsonb not null default '{}'::jsonb;

alter table public.inspection_items
  add column if not exists line_order integer not null default 0;

-- Backfill line_order within each (plo_id, room) by creation time.
with ranked as (
  select
    id,
    row_number() over (partition by plo_id, room order by created_at asc) - 1 as rn
  from public.inspection_items
)
update public.inspection_items i
set line_order = ranked.rn
from ranked
where i.id = ranked.id;
