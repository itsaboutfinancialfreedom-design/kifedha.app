CREATE TABLE public.user_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  risk_score INT NOT NULL,
  risk_level TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_risk_profiles TO authenticated;
GRANT ALL ON public.user_risk_profiles TO service_role;

ALTER TABLE public.user_risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own risk profiles"
ON public.user_risk_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own risk profiles"
ON public.user_risk_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own risk profiles"
ON public.user_risk_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own risk profiles"
ON public.user_risk_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_user_risk_profiles_user_id ON public.user_risk_profiles(user_id, assessed_at DESC);