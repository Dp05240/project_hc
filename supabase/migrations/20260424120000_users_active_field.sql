-- Add is_active column to inspectors and contractors tables
alter table public.inspectors
  add column if not exists is_active boolean not null default true;

alter table public.contractors
  add column if not exists is_active boolean not null default true;

-- Add company_name and trade_type to contractors if not present
alter table public.contractors
  add column if not exists company_name text;

alter table public.contractors
  add column if not exists trade_type text;

-- Add created_by to both tables if not present
alter table public.inspectors
  add column if not exists created_by uuid references auth.users(id);

alter table public.contractors
  add column if not exists created_by uuid references auth.users(id);
