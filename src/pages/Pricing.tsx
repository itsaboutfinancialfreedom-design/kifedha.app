import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Crown, Sparkles } from "lucide-react";

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
  "Auto-M-Pesa statement import",
  "PDF financial reports",
  "Email reminders & weekly digest",
  "Unlimited AI advisor chat",
  "Priority support",
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Pricing</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> 7-day free trial on Premium · Cancel anytime
          </div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-sm text-muted-foreground">
            Start free. Upgrade when you're ready to unlock the full Kifedha advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-bold text-lg">Free</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted">Current</span>
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
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold">$8</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">≈ KES 1,040/month</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-xl font-display font-bold">$80</span>
                <span className="text-xs text-muted-foreground">/year</span>
              </div>
              <p className="text-[11px] text-success mt-0.5">Save 17% with yearly billing</p>
            </div>
            <ul className="space-y-2 text-sm">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-success flex-none mt-0.5" /><span>{f}</span></li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/auth")}
              className="mt-5 w-full py-3 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm shadow-elevated transition-transform active:scale-[0.98]"
            >
              Get started
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">Secure checkout · Cancel anytime</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">How billing works</p>
          <p>
            Start your 7-day free trial today. After the trial ends, you'll continue on your chosen plan
            unless you cancel. Manage or cancel anytime from Settings. Payments processed securely via Paddle.
          </p>
        </div>
      </div>
    </div>
  );
}
