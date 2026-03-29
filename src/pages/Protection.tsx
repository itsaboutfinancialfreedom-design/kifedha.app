import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { ScoreRing } from "@/components/ScoreRing";
import { Shield, Heart, Briefcase, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Protection() {
  const { financials, blueprint } = useApp();
  if (!financials || !blueprint) return null;

  const income = financials.monthlyIncome;

  const recommendations = [
    {
      icon: Heart,
      title: "Life Insurance",
      has: financials.hasLifeInsurance,
      description: financials.hasLifeInsurance
        ? "You're covered. Review your policy annually."
        : `Recommended cover: KES ${(income * 60).toLocaleString()} (5x annual income). This protects your ${financials.dependents} dependent${financials.dependents !== 1 ? "s" : ""}.`,
    },
    {
      icon: Shield,
      title: "Health Cover",
      has: financials.hasHealthInsurance,
      description: financials.hasHealthInsurance
        ? "Great! Make sure your cover includes inpatient and outpatient."
        : "Start with NHIF (KES 500/mo) or explore affordable private health plans.",
    },
    {
      icon: Briefcase,
      title: "Income Protection",
      has: false,
      description: "If you can't work due to illness or injury, income protection replaces your salary. Consider a policy covering 60-70% of your income.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="font-display text-2xl font-bold mb-1">Risk & Protection</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Protect what you've built. Here's where you stand.
        </p>

        {/* Risk Score */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-4 flex items-center gap-6">
          <div className="relative">
            <ScoreRing score={blueprint.riskScore} size={100} variant="risk" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-base">Financial Risk Score</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {blueprint.riskScore > 60
                ? "Your finances are exposed. Let's fix this."
                : blueprint.riskScore > 30
                ? "You're partially protected. Room for improvement."
                : "You're well protected! Keep it up."}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          {recommendations.map(({ icon: Icon, title, has, description }) => (
            <div key={title} className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  has ? "bg-success/10" : "bg-danger/10"
                }`}>
                  <Icon className={`w-5 h-5 ${has ? "text-success" : "text-danger"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-sm">{title}</h3>
                </div>
                {has ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-danger" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Insurance allocation */}
        <div className="bg-card rounded-2xl p-5 shadow-card mt-4">
          <h3 className="font-display font-semibold text-sm mb-2">Monthly Protection Budget</h3>
          <p className="text-2xl font-display font-bold text-primary">
            KES {blueprint.allocation.protection.amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {blueprint.allocation.protection.percent}% of your income dedicated to protection
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
