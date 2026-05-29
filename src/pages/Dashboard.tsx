import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ScoreRing } from "@/components/ScoreRing";
import { InsightCard } from "@/components/InsightCard";
import { Recommendations } from "@/components/Recommendations";
import { TrendingUp, Shield, AlertTriangle, ChevronRight, Sparkles, Settings as SettingsIcon, BookOpenCheck, Bell, FileDown, Lock } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { generateInsights } from "@/lib/insightsEngine";
import { toast } from "sonner";

  const { financials, blueprint, hasCompletedOnboarding, automation, setAutomation, isPremium } = useApp();
  const navigate = useNavigate();
  const captureRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!isPremium) {
      toast.error("PDF export is a Premium feature");
      navigate("/advisor/upgrade");
      return;
    }
    if (!captureRef.current) return;
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(captureRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = 210;
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("kifedha-dashboard.pdf");
  };


  useEffect(() => {
    if (!hasCompletedOnboarding) navigate("/");
  }, [hasCompletedOnboarding, navigate]);

  const insights = useMemo(
    () => (financials && blueprint ? generateInsights(financials, blueprint) : []),
    [financials, blueprint]
  );

  if (!financials || !blueprint) return null;

  const visibleInsights = insights.filter(i => {
    if (i.category === "balance" && !automation.lowBalanceAlerts) return false;
    if (i.category === "subscription" && !automation.subscriptionScan) return false;
    return true;
  });

  const allocationItems = [
    { label: "Needs", ...blueprint.allocation.needs, color: "bg-primary" },
    { label: "Savings", ...blueprint.allocation.savings, color: "bg-success" },
    { label: "Investments", ...blueprint.allocation.investments, color: "bg-accent" },
    { label: "Protection", ...blueprint.allocation.protection, color: "gradient-premium" },
    { label: "Debt", ...blueprint.allocation.debtRepayment, color: "bg-danger" },
  ];

  function handleInsightAction(id: string) {
    if (id === "round-ups") {
      setAutomation({ ...automation, roundUps: true });
      navigate("/settings");
    } else if (id === "idle-cash") {
      setAutomation({ ...automation, autoSweepSurplus: true });
      navigate("/settings");
    } else if (id.startsWith("subs") || id.startsWith("low-balance") || id === "top-category") {
      navigate("/budget");
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-gold px-4 pt-8 pb-10 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-warning-foreground/70 text-sm font-medium">Welcome back 👋</p>
              <h1 className="font-display text-2xl font-bold text-warning-foreground mt-1">
                Kifedha
              </h1>
            </div>
            <button
              onClick={() => navigate("/settings")}
              aria-label="Trust & automation settings"
              className="p-2 rounded-xl bg-warning-foreground/10 hover:bg-warning-foreground/20 transition-colors"
            >
              <SettingsIcon className="w-5 h-5 text-warning-foreground" />
            </button>
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div className="relative">
              <ScoreRing score={blueprint.healthScore} size={100} />
            </div>
            <div>
              <p className="text-warning-foreground/70 text-xs">Monthly Income</p>
              <p className="font-display text-xl font-bold text-warning-foreground">
                KES {(financials.monthlyIncome ?? 0).toLocaleString()}
              </p>
              <p className="text-warning-foreground/70 text-xs mt-2">Financial Health Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* AI Advisor CTA */}
        <button
          onClick={() => navigate("/advisor")}
          className="w-full bg-card rounded-2xl p-4 shadow-elevated flex items-center gap-3 text-left active:scale-[0.99] transition-transform border border-border"
        >
          <div className="w-11 h-11 rounded-xl gradient-premium flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-premium-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm">Talk to your AI Advisor</p>
            <p className="text-xs text-muted-foreground">Get a personalized 4-pillar diagnosis in minutes</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => navigate("/dashboards")}
          className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left border border-border"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm">Financial Dashboards</p>
            <p className="text-xs text-muted-foreground">Literacy, wealth planning, and insurance penetration in one view</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        {/* Personalized recommendations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-base font-semibold">Recommended for you</h2>
            <button onClick={() => navigate("/settings/notifications")} className="text-xs text-primary flex items-center gap-1">
              <Bell className="w-3 h-3" /> Notifications
            </button>
          </div>
          <Recommendations compact />
        </div>

        {/* Proactive Insights (Pillar 2) */}
        {visibleInsights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-base font-semibold">Proactive Insights</h2>
              <span className="text-[11px] text-muted-foreground">{visibleInsights.length} new</span>
            </div>
            {visibleInsights.map(ins => (
              <InsightCard
                key={ins.id}
                insight={ins}
                onAction={() => handleInsightAction(ins.id)}
              />
            ))}
          </div>
        )}

        {/* Allocation Breakdown */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-base font-semibold mb-4">Income Allocation</h2>
          <div className="space-y-3">
            {allocationItems.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="text-sm font-semibold">KES {(item.amount ?? 0).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{item.percent ?? 0}%</span>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden mt-4">
            {allocationItems.map(item => (
              <div
                key={item.label}
                className={`${item.color} transition-all`}
                style={{ width: `${item.percent ?? 0}%` }}
              />
            ))}
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-premium" />
            <h2 className="font-display text-base font-semibold">Financial Risk Score</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ScoreRing score={blueprint.riskScore} size={80} variant="risk" />
            </div>
            <div className="flex-1 space-y-1.5">
              {blueprint.risks.slice(0, 2).map((risk, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-danger mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display text-base font-semibold">Your Action Plan</h2>
          </div>
          <div className="space-y-2.5">
            {blueprint.actionPlan.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center text-xs font-bold text-warning-foreground shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        {[
          { label: "Goal Planning", to: "/goals", icon: TrendingUp },
          { label: "Financial Dashboards", to: "/dashboards", icon: BookOpenCheck },
          { label: "Protection Insights", to: "/protection", icon: Shield },
        ].map(({ label, to, icon: Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 shadow-card"
          >
            <Icon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium flex-1 text-left">{label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
