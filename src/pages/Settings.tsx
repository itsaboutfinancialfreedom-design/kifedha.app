import { useNavigate } from "react-router-dom";
import { useApp, AutomationSettings } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MessageCircle, Phone, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  const { automation, setAutomation } = useApp();

  const update = (key: keyof AutomationSettings, value: boolean) => {
    setAutomation({ ...automation, [key]: value });
    toast.success(`${value ? "Enabled" : "Disabled"} ${TOGGLES.find(t => t.key === key)?.title}`);
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
      </div>

      <BottomNav />
    </div>
  );
}
