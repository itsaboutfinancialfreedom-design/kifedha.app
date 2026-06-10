
CREATE OR REPLACE FUNCTION public.enforce_free_goal_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_premium boolean;
  goal_count int;
BEGIN
  is_premium := public.has_active_subscription(NEW.user_id, 'live')
             OR public.has_active_subscription(NEW.user_id, 'sandbox');
  IF is_premium THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO goal_count FROM public.user_goals WHERE user_id = NEW.user_id;
  IF goal_count >= 2 THEN
    RAISE EXCEPTION 'Free plan limited to 2 goals. Upgrade to add more.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_free_debt_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_premium boolean;
  debt_count int;
BEGIN
  is_premium := public.has_active_subscription(NEW.user_id, 'live')
             OR public.has_active_subscription(NEW.user_id, 'sandbox');
  IF is_premium THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO debt_count FROM public.user_debts WHERE user_id = NEW.user_id;
  IF debt_count >= 5 THEN
    RAISE EXCEPTION 'Free plan limited to 5 debts. Upgrade to add more.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_goal_limit_trg ON public.user_goals;
CREATE TRIGGER enforce_free_goal_limit_trg
BEFORE INSERT ON public.user_goals
FOR EACH ROW EXECUTE FUNCTION public.enforce_free_goal_limit();

DROP TRIGGER IF EXISTS enforce_free_debt_limit_trg ON public.user_debts;
CREATE TRIGGER enforce_free_debt_limit_trg
BEFORE INSERT ON public.user_debts
FOR EACH ROW EXECUTE FUNCTION public.enforce_free_debt_limit();
