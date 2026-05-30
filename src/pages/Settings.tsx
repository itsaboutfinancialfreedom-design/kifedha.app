import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp, AutomationSettings } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MessageCircle, Phone, Shield, Sparkles, Crown, ExternalLink, Loader2, LogOut, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

interface ToggleDef {
  key: keyof AutomationSettings;
  title: string;
  desc: string;
  why: string;
}

const TOGGLES: ToggleDef[] = [
  {
    key: "autopilotGoals",
    title: "Goal Autopilot",
    desc: "Automatically allocate part of your monthly savings to each goal.",
    why: "We split your savings allocation across active goals based on the amount and deadline you set.",
  },
  {
    key: "roundUps",
    title: "Round-ups",
    desc: "Round each transaction to the nearest 100 and save the difference.",
    why: "Estimated from your number of expense categories × typical monthly transactions.",
  },
  {
    key: "lowBalanceAlerts",
    title: "Low-balance alerts",
    desc: "Warn me before bills are due if my buffer is too thin.",
    why: "Triggers when monthly surplus drops below 15% of income.",
  },
  {
    key: "subscriptionScan",
    title: "Subscription scanner",
    desc: "Detect duplicate or unused recurring charges.",
    why: "Matches expense names against a list of common subscription services.",
  },
  {
    key: "autoSweepSurplus",
    title: "Auto-sweep idle cash",
    desc: "Move emergency-fund surplus to a higher-yield account suggestion.",
    why: "Triggers when your emergency fund exceeds 6 months of income.",
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { automation, setAutomation, isPremium, isTrialing, trialDaysLeft } = useApp();
  const [portalLoading, setPortalLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const update = (key: keyof AutomationSettings, value: boolean) => {
    setAutomation({ ...automation, [key]: value });
    toast.success(`${value ? "Enabled" : "Disabled"} ${TOGGLES.find(t => t.key === key)?.title}`);
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { environment: getPaddleEnvironment() },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "Could not open billing portal");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Trust & Automation</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Trust banner */}
        <div className="rounded-2xl p-4 bg-card shadow-card border border-border">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-sm">You're always in control</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Every automated action can be turned off. Tap "Why?" on any insight to see exactly how Kifedha reached its conclusion.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl p-5 bg-card shadow-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-warning" />
            <h2 className="font-display font-semibold text-sm">Subscription</h2>
          </div>
          {isPremium ? (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                Premium active{isTrialing ? ` · ${trialDaysLeft}d trial left` : ""}. Manage billing,
                switch between monthly and yearly, or cancel anytime.
              </p>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage subscription
              </button>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Cancellation takes effect immediately.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                You're on the Free plan. Upgrade to unlock the full Kifedha advantage.
              </p>
              <button
                onClick={() => navigate("/advisor/upgrade")}
                className="w-full py-3 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm"
              >
                Upgrade — $8/month
              </button>
            </>
          )}
        </div>

        {/* Toggles */}
        <div className="bg-card rounded-2xl shadow-card divide-y divide-border">
          {TOGGLES.map(t => (
            <div key={t.key} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{t.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1.5 italic">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {t.why}
                </p>
              </div>
              <Switch
                checked={automation[t.key]}
                onCheckedChange={(v) => update(t.key, v)}
              />
            </div>
          ))}
        </div>

        {/* Human access */}
        <div className="rounded-2xl p-5 bg-card shadow-card border border-border">
          <h2 className="font-display font-semibold text-sm mb-1">Talk to a human</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Prefer real advice? Reach a certified financial advisor in under one business day.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://wa.me/254700000000?text=Hi%2C%20I%27d%20like%20to%20speak%20to%20a%20Kifedha%20advisor"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-success-foreground font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href="tel:+254700000000"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="rounded-2xl p-5 bg-card shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold text-sm">Legal</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/pricing" className="py-2.5 rounded-xl border border-border bg-muted text-center text-xs font-semibold hover:bg-muted/80 transition-colors">
              Pricing
            </Link>
            <Link to="/privacy" className="py-2.5 rounded-xl border border-border bg-muted text-center text-xs font-semibold hover:bg-muted/80 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="py-2.5 rounded-xl border border-border bg-muted text-center text-xs font-semibold hover:bg-muted/80 transition-colors">
              Terms of Service
            </Link>
            <Link to="/refund" className="py-2.5 rounded-xl border border-border bg-muted text-center text-xs font-semibold hover:bg-muted/80 transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl p-5 bg-card shadow-card border border-border">
          <h2 className="font-display font-semibold text-sm mb-4">Account</h2>
          <button
            onClick={async () => {
              setLoggingOut(true);
              await signOut();
              navigate("/auth");
            }}
            disabled={loggingOut}
            className="w-full py-3 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Log out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
