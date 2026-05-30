import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

export interface SubscriptionRow {
  id: string;
  status: string;
  price_id: string;
  product_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  environment: string;
}

function computeActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const now = Date.now();
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : Infinity;
  if (["active", "trialing", "past_due"].includes(row.status)) return end === Infinity || end > now;
  // Canceled: keep access until the end of the paid period (grace).
  if (row.status === "canceled") return end > now;
  return false;
}

export function usePremium() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = useCallback(async () => {
    if (!user) { setSubscription(null); setLoading(false); return; }
    const env = getPaddleEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as unknown as SubscriptionRow) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSub();
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, () => fetchSub())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSub]);

  return {
    subscription,
    isPremium: computeActive(subscription),
    loading,
    refetch: fetchSub,
  };
}
