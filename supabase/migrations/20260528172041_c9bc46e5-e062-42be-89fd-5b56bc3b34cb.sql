CREATE TABLE public.user_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  needs_percent INT NOT NULL,
  savings_percent INT NOT NULL,
  investments_percent INT NOT NULL,
  protection_percent INT NOT NULL,
  monthly_income NUMERIC(12,2) NOT NULL,
  needs_amount NUMERIC(12,2) NOT NULL,
  savings_amount NUMERIC(12,2) NOT NULL,
  investments_amount NUMERIC(12,2) NOT NULL,
  protection_amount NUMERIC(12,2) NOT NULL,
  risk_tolerance TEXT,
  has_dependents BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_allocations TO authenticated;
GRANT ALL ON public.user_allocations TO service_role;

ALTER TABLE public.user_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own allocations" ON public.user_allocations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own allocations" ON public.user_allocations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own allocations" ON public.user_allocations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own allocations" ON public.user_allocations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_allocations_updated_at
BEFORE UPDATE ON public.user_allocations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();