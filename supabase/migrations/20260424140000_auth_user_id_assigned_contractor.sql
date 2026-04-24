-- Add auth_user_id to inspectors and contractors
alter table public.inspectors
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table public.contractors
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- Add assigned_contractor_id to work_orders so PMs can assign to specific contractors
alter table public.work_orders
  add column if not exists assigned_contractor_id uuid references public.contractors(id) on delete set null;
