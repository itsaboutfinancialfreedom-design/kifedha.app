import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/ScoreRing";
import { useApp } from "@/context/AppContext";
import { generateInsights } from "@/lib/insightsEngine";
import { ArrowLeft, BookOpenCheck, ChevronRight, Shield, Sparkles, Target, TrendingUp } from "lucide-react";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function Dashboards() {
  const { financials, blueprint, hasCompletedOnboarding, automation, autopilots } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasCompletedOnboarding) navigate("/");
  }, [hasCompletedOnboarding, navigate]);

  const insights = useMemo(() => {
    if (!financials || !blueprint) return [];
    return generateInsights(financials, blueprint);
  }, [financials, blueprint]);

  if (!financials || !blueprint) return null;

  const subscriptionInsights = insights.filter((item) => item.category === "subscription").length;
  const dangerInsights = insights.filter((item) => item.severity === "danger").length;
  const savingsRate = financials.monthlyIncome > 0
    ? ((blueprint.allocation.savings.amount + blueprint.allocation.investments.amount) / financials.monthlyIncome) * 100
    : 0;
  const debtServiceRate = financials.monthlyIncome > 0
    ? (financials.debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0) / financials.monthlyIncome) * 100
    : 0;
  const goalCoverage = financials.goals.length > 0 ? Math.min(100, (autopilots.filter((item) => item.enabled).length / financials.goals.length) * 100) : 0;
  const protectionCoverage = [financials.hasLifeInsurance, financials.hasHealthInsurance, financials.hasEmergencyFund].filter(Boolean).length;

  const literacyScore = clampScore(
    (financials.hasEmergencyFund ? 25 : 5) +
      (financials.hasLifeInsurance ? 15 : 0) +
      (financials.hasHealthInsurance ? 15 : 0) +
      Math.min(25, savingsRate) +
      (automation.lowBalanceAlerts ? 10 : 0) +
      (automation.subscriptionScan ? 10 : 0),
  );

  const wealthScore = clampScore(
    blueprint.healthScore * 0.45 +
      Math.min(25, savingsRate * 1.2) +
      Math.min(15, goalCoverage * 0.15) +
      Math.max(0, 15 - debtServiceRate * 0.5),
  );

  const insuranceScore = clampScore(
    protectionCoverage * 25 +
      Math.min(25, blueprint.allocation.protection.percent * 4) +
      Math.max(0, 15 - dangerInsights * 5),
  );

  const literacyActions = [
    automation.lowBalanceAlerts ? "Low-balance alerts are active." : "Turn on low-balance alerts for earlier warnings.",
    automation.subscriptionScan ? "Subscription scan is watching recurring charges." : "Enable subscription scanning to catch waste.",
    financials.hasEmergencyFund
      ? `Emergency fund tracked at KES ${financials.emergencyFundAmount.toLocaleString()}.`
      : "Start an emergency fund so setbacks don’t become debt.",
  ];

  const wealthActions = [
    `You are directing ${Math.round(savingsRate)}% of income to long-term growth.`,
    financials.goals.length > 0
      ? `${financials.goals.length} wealth goal${financials.goals.length > 1 ? "s are" : " is"} being tracked.`
      : "Add at least one wealth goal to make progress measurable.",
    autopilots.some((item) => item.enabled)
      ? "Goal autopilot is active for at least one goal."
      : "Enable goal autopilot to automate wealth building.",
  ];

  const insuranceActions = [
    financials.hasLifeInsurance
      ? "Life cover is in place. Review the sum assured yearly."
      : "Add life cover to protect dependents and major goals.",
    financials.hasHealthInsurance
      ? "Health cover is active."
      : "Add health cover to reduce shock from medical bills.",
    `Protection budget is ${blueprint.allocation.protection.percent}% of income (KES ${blueprint.allocation.protection.amount.toLocaleString()}/mo).`,
  ];

  const statCards = [
    {
      title: "Financial Literacy",
      score: literacyScore,
      tone: "text-primary",
      icon: BookOpenCheck,
      subtitle: `${dangerInsights} critical risk${dangerInsights === 1 ? "" : "s"} need attention`,
    },
    {
      title: "Wealth Planning",
      score: wealthScore,
      tone: "text-success",
      icon: TrendingUp,
      subtitle: `${financials.goals.length} goal${financials.goals.length === 1 ? "" : "s"} linked to your plan`,
    },
    {
      title: "Insurance Penetration",
      score: insuranceScore,
      tone: "text-premium",
      icon: Shield,
      subtitle: `${protectionCoverage}/3 core protections currently covered`,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-gold px-4 pt-8 pb-10 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-warning-foreground/80 text-sm mb-2 hover:text-warning-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <p className="text-warning-foreground/70 text-sm font-medium">Kifedha intelligence</p>
          <h1 className="font-display text-2xl font-bold text-warning-foreground mt-1">Strategic Dashboards</h1>
          <p className="text-warning-foreground/75 text-sm mt-2 max-w-md">
            Monitor literacy, long-term wealth readiness, and insurance coverage from one place.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {statCards.map(({ title, score, subtitle, icon: Icon, tone }) => (
            <div key={title} className="bg-card rounded-2xl p-5 shadow-card border border-border flex items-center gap-4">
              <ScoreRing score={score} size={78} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${tone}`} />
                  <h2 className="font-display text-sm font-semibold">{title}</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="literacy" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-muted p-1 rounded-xl">
            <TabsTrigger value="literacy" className="text-[11px] px-2 py-2">Literacy</TabsTrigger>
            <TabsTrigger value="wealth" className="text-[11px] px-2 py-2">Wealth</TabsTrigger>
            <TabsTrigger value="insurance" className="text-[11px] px-2 py-2">Insurance</TabsTrigger>
          </TabsList>

          <TabsContent value="literacy" className="space-y-4 mt-0">
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <BookOpenCheck className="w-5 h-5 text-primary" />
                <h3 className="font-display text-base font-semibold">Financial literacy dashboard</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Active alerts</p>
                  <p className="font-display text-xl font-bold mt-1">{insights.length}</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Recurring charges flagged</p>
                  <p className="font-display text-xl font-bold mt-1">{subscriptionInsights}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {literacyActions.map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wealth" className="space-y-4 mt-0">
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-success" />
                <h3 className="font-display text-base font-semibold">Wealth planning dashboard</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Save + invest</p>
                  <p className="font-display text-lg font-bold mt-1">{Math.round(savingsRate)}%</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Goals</p>
                  <p className="font-display text-lg font-bold mt-1">{financials.goals.length}</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Autopilot</p>
                  <p className="font-display text-lg font-bold mt-1">{autopilots.filter((item) => item.enabled).length}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {wealthActions.map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                    <Target className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insurance" className="space-y-4 mt-0">
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-premium" />
                <h3 className="font-display text-base font-semibold">Insurance penetration dashboard</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Life", value: financials.hasLifeInsurance ? "Yes" : "No" },
                  { label: "Health", value: financials.hasHealthInsurance ? "Yes" : "No" },
                  { label: "Emergency", value: financials.hasEmergencyFund ? "Yes" : "No" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-muted/60 p-3">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="font-display text-lg font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {insuranceActions.map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                    <Shield className="w-4 h-4 text-premium mt-0.5 shrink-0" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-card rounded-2xl p-5 shadow-card border border-border space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold">Take action</h2>
              <p className="text-xs text-muted-foreground mt-1">Jump straight to the area that improves your score fastest.</p>
            </div>
          </div>
          {[
            { label: "Improve wealth plan", to: "/goals", icon: TrendingUp },
            { label: "Reduce spending pressure", to: "/budget", icon: Target },
            { label: "Close protection gaps", to: "/protection", icon: Shield },
          ].map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-left"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium flex-1">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}