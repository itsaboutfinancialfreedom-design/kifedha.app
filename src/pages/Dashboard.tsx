import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ScoreRing } from "@/components/ScoreRing";
import { TrendingUp, Shield, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { useEffect } from "react";

export default function Dashboard() {
  const { financials, blueprint, hasCompletedOnboarding } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasCompletedOnboarding) navigate("/");
  }, [hasCompletedOnboarding, navigate]);

  if (!financials || !blueprint) return null;

  const allocationItems = [
    { label: "Needs", ...blueprint.allocation.needs, color: "bg-primary" },
    { label: "Savings", ...blueprint.allocation.savings, color: "bg-success" },
    { label: "Investments", ...blueprint.allocation.investments, color: "bg-accent" },
    { label: "Protection", ...blueprint.allocation.protection, color: "gradient-premium" },
    { label: "Debt", ...blueprint.allocation.debtRepayment, color: "bg-danger" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-gold px-4 pt-8 pb-10 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <p className="text-warning-foreground/70 text-sm font-medium">Welcome back 👋</p>
          <h1 className="font-display text-2xl font-bold text-warning-foreground mt-1">
            Your Financial Blueprint
          </h1>
          <div className="mt-6 flex items-center gap-6">
            <div className="relative">
              <ScoreRing score={blueprint.healthScore} size={100} />
            </div>
            <div>
              <p className="text-warning-foreground/70 text-xs">Monthly Income</p>
              <p className="font-display text-xl font-bold text-warning-foreground">
                KES {financials.monthlyIncome.toLocaleString()}
              </p>
              <p className="text-warning-foreground/70 text-xs mt-2">Financial Health Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Allocation Breakdown */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-base font-semibold mb-4">Income Allocation</h2>
          <div className="space-y-3">
            {allocationItems.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="text-sm font-semibold">KES {item.amount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden mt-4">
            {allocationItems.map(item => (
              <div
                key={item.label}
                className={`${item.color} transition-all`}
                style={{ width: `${item.percent}%` }}
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
