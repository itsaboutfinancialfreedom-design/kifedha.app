-- Subscriptions table for Paddle
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND environment = check_env
    AND (
      (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  );
$$;

-- Transactions table for M-Pesa PDF import + manual entry
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense')),
  category text,
  description text,
  source text NOT NULL DEFAULT 'manual',
  external_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, occurred_at DESC);
CREATE UNIQUE INDEX idx_transactions_user_ref ON public.transactions(user_id, external_ref) WHERE external_ref IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own transactions" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own transactions" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reminders log (for cron dedupe)
CREATE TABLE public.user_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  reference text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_reminders_lookup ON public.user_reminders(user_id, reminder_type, reference, sent_at DESC);

GRANT SELECT ON public.user_reminders TO authenticated;
GRANT ALL ON public.user_reminders TO service_role;

ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminders" ON public.user_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service manages reminders" ON public.user_reminders FOR ALL USING (auth.role() = 'service_role');