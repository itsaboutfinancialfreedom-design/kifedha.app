CREATE TABLE public.user_protection_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  life_insurance_gap NUMERIC(14,2) NOT NULL DEFAULT 0,
  health_insurance_gap NUMERIC(14,2) NOT NULL DEFAULT 0,
  income_protection_gap NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_gap NUMERIC(14,2) NOT NULL DEFAULT 0,
  protection_score INT NOT NULL DEFAULT 0,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_protection_gaps TO authenticated;
GRANT ALL ON public.user_protection_gaps TO service_role;

ALTER TABLE public.user_protection_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own protection gaps" ON public.user_protection_gaps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own protection gaps" ON public.user_protection_gaps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own protection gaps" ON public.user_protection_gaps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own protection gaps" ON public.user_protection_gaps FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_user_protection_gaps_user_id ON public.user_protection_gaps(user_id);