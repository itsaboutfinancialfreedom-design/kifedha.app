ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_life_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_health_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_emergency_fund boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_fund_amount numeric NOT NULL DEFAULT 0;