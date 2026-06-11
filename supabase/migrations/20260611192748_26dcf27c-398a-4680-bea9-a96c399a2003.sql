alter table public.profiles
  add column if not exists financials jsonb,
  add column if not exists blueprint jsonb;