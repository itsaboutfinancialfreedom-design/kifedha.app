import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function PastDueBanner() {
  const { user } = useAuth();
  const [pastDue, setPastDue] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) { setPastDue(false); return; }
    const env = getPaddleEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPastDue((data as any)?.status === "past_due");
  }, [user]);

  useEffect(() => {
    fetchStatus();
    if (!user) return;
    const ch = supabase
      .channel(`past-due-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, fetchStatus)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchStatus]);

  if (!pastDue) return null;

  const openPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { environment: getPaddleEnvironment() },
      });
      const target = data?.updatePayment || data?.url;
      if (error || !target) throw new Error(error?.message ?? "Could not open billing portal");
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-sm text-destructive flex items-center justify-center gap-3 flex-wrap">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <AlertTriangle className="w-4 h-4" />
        Payment failed. Update your payment method to keep Premium.
      </span>
      <button
        onClick={openPortal}
        disabled={loading}
        className="underline font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Update payment
      </button>
    </div>
  );
}
