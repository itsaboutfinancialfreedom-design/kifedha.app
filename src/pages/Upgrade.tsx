import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, X, Crown, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { toast } from "sonner";

type Cycle = "monthly" | "yearly";

const FREE_FEATURES = [
  "Up to 2 savings goals",
  "Basic debt plan",
  "Manual expense & income tracking",
  "Monthly summary",
  "6 advisor messages / month",
];

const PREMIUM_FEATURES = [
  "Unlimited savings goals",
  "Advanced debt simulator (snowball / avalanche)",
  "M-Pesa SMS auto-logging (paste any SMS to log instantly)",
  "PDF financial reports",
  "Email reminders & weekly digest",
  "Unlimited AI advisor chat",
  "Priority support",
];

// Pricing displayed to users. Paddle bills in USD; KES is illustrative
// at ~130 KES / USD. Update both together if the Paddle prices change.
const PRICES: Record<Cycle, { usd: number; kes: number; priceId: string; cadence: string }> = {
  monthly: { usd: 8, kes: 1040, priceId: "premium_monthly", cadence: "/month" },
  yearly:  { usd: 80, kes: 10400, priceId: "premium_yearly", cadence: "/year" },
};

export default function Upgrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, isTrialing, trialDaysLeft } = useApp();
  const { openCheckout, loading } = usePaddleCheckout();
  const [cycle, setCycle] = useState<Cycle>("monthly");

  const handleUpgrade = async () => {
    if (!user) { navigate("/auth"); return; }
    try {
      await openCheckout({
        priceId: PRICES[cycle].priceId,
        userId: user.id,
        customerEmail: user.email ?? undefined,
        successUrl: `${window.location.origin}/advisor/success?cycle=${cycle}`,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open checkout");
    }
  };

  const p = PRICES[cycle];

  return (
    <div className="min-h-screen bg-background pb-28">
      <PaymentTestModeBanner />
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Upgrade to Premium</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> 14-day free trial · Cancel anytime
          </div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Get the full Kifedha advantage
          </h2>
          <p className="text-sm text-muted-foreground">
            Unlock unlimited goals, deeper simulations, and your AI financial advisor.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="inline-flex bg-muted rounded-full p-1 text-xs font-semibold">
            <button onClick={() => setCycle("monthly")} className={`px-4 py-1.5 rounded-full transition ${cycle === "monthly" ? "bg-card shadow-card" : "text-muted-foreground"}`}>Monthly</button>
            <button onClick={() => setCycle("yearly")} className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 ${cycle === "yearly" ? "bg-card shadow-card" : "text-muted-foreground"}`}>
              Yearly
              <span className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[10px]">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-bold text-lg">Free</h3>
              {!isPremium && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted">Current</span>}
            </div>
            <p className="text-xs text-muted-foreground mb-4">For getting started</p>
            <div className="mb-4">
              <span className="text-3xl font-display font-bold">$0</span>
              <span className="text-xs text-muted-foreground"> /forever</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">KES 0</p>
            </div>
            <ul className="space-y-2 text-sm">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-muted-foreground flex-none mt-0.5" /><span>{f}</span></li>
              ))}
              {PREMIUM_FEATURES.slice(0, 3).map(f => (
                <li key={f} className="flex gap-2 text-muted-foreground"><X className="w-4 h-4 flex-none mt-0.5" /><span className="line-through">{f}</span></li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border-2 border-warning bg-card p-5 shadow-elevated overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl gradient-premium text-premium-foreground text-[10px] font-bold tracking-wide">RECOMMENDED</div>
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-4 h-4 text-warning" />
              <h3 className="font-display font-bold text-lg">Premium</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">For serious wealth builders</p>
            <div className="mb-4">
              <span className="text-3xl font-display font-bold text-primary">KES {p.kes.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground"> {p.cadence}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">≈ ${p.usd} USD {p.cadence}</p>
              {cycle === "yearly" && <p className="text-[11px] text-success mt-0.5">2 months free vs monthly</p>}
            </div>
            <ul className="space-y-2 text-sm">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-success flex-none mt-0.5" /><span>{f}</span></li>
              ))}
            </ul>

            {isPremium ? (
              <div className="mt-5 space-y-2">
                <div className="w-full py-3 rounded-xl bg-success/10 text-success font-semibold text-sm text-center">
                  Premium active{isTrialing ? ` · ${trialDaysLeft}d trial left` : ""}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Manage or cancel in Settings.
                </p>
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="mt-5 w-full py-3 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm shadow-elevated transition-transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Opening checkout…" : "Start 14-day free trial"}
              </button>
            )}
            <p className="text-[11px] text-muted-foreground text-center mt-2">Secure checkout · Cancel anytime</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">How billing works</p>
          <p>
            Start your 14-day free trial today. After the trial ends, you'll continue on the {cycle} plan
            unless you cancel. No charge during the trial — cancel anytime. Manage or cancel anytime from Settings. Payments processed securely via Paddle.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
