import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ScoreRing } from "@/components/ScoreRing";
import { InsightCard } from "@/components/InsightCard";
import { Recommendations } from "@/components/Recommendations";
import { TrendingUp, Shield, AlertTriangle, ChevronRight, Sparkles, Settings as SettingsIcon, BookOpenCheck, Bell, FileDown, Lock, Smartphone, MessageSquareText, Loader2, TrendingDown, Wallet, BookOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateInsights } from "@/lib/insightsEngine";
import { toast } from "sonner";
import { generateFinancialReport } from "@/utils/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTransactions } from "@/context/TransactionsContext";
import { computeLearnSuggestion, loadViewed, LEARN_TOTAL_TOPICS } from "@/pages/Learn";
import { supabase } from "@/integrations/supabase/client";
import { autoCategorize, Category } from "@/lib/categorize";

export default function Dashboard() {
  const { financials, blueprint, hasCompletedOnboarding, automation, setAutomation, isPremium } = useApp();
  const { user, profile } = useAuth();
  const { transactions, addTransaction } = useTransactions();

  const navigate = useNavigate();
  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsBusy, setSmsBusy] = useState(false);

  const exportPDF = async () => {
    if (!isPremium) {
      toast.error("PDF export is a Premium feature");
      navigate("/advisor/upgrade");
      return;
    }
    if (!user) return;
    setExporting(true);
    try {
      await generateFinancialReport({
        userId: user.id,
        userName: profile?.full_name ?? null,
        userEmail: user.email ?? null,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate PDF");
    } finally {
      setExporting(false);
    }
  };

  async function parseSMS() {
    const text = smsText.trim();
    if (!text) { toast.error("Paste an M-Pesa SMS first"); return; }
    setSmsBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-transaction", { body: { text } });
      if (error) throw error;
      if (!data || !data.amount) { toast.error("Couldn't extract a transaction from that SMS"); return; }
      addTransaction({
        type: data.type,
        amount: Number(data.amount),
        note: data.note,
        category: data.category as Category,
        date: new Date().toISOString(),
        source: "mpesa",
      });
      toast.success(`Logged: ${data.note} · KES ${Number(data.amount).toLocaleString()}`);
      setSmsText("");
      setSmsOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "SMS parsing failed");
    } finally {
      setSmsBusy(false);
    }
  }

  useEffect(() => {
    if (!hasCompletedOnboarding) navigate("/");
  }, [hasCompletedOnboarding, navigate]);

  const insights = useMemo(
    () => (financials && blueprint ? generateInsights(financials, blueprint) : []),
    [financials, blueprint]
  );

  const learnViewed = useMemo(() => loadViewed(), []);
  const learnDone = learnViewed.pillars.length + learnViewed.terms.length;
  const learnSuggestion = useMemo(() => {
    const m = new Date().getMonth();
    const highCardSpend = transactions
      .filter(t => t.type === "expense" && new Date(t.date).getMonth() === m)
      .reduce((s, t) => s + t.amount, 0) > 30000;
    return computeLearnSuggestion({
      roundUps: automation.roundUps,
      autopilot: automation.autopilotGoals,
      autoSweep: automation.autoSweepSurplus,
      hasDebt: !!financials && financials.totalDebt > 0,
      hasGoals: !!financials && financials.goals.length > 0,
      hasHealth: !!financials?.hasHealthInsurance,
      hasLife: !!financials?.hasLifeInsurance,
      hasEmergency: !!financials?.hasEmergencyFund,
      highCardSpend,
    }, learnViewed);
  }, [transactions, automation, financials, learnViewed]);

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
            <div className="flex items-center gap-2">

              <button
                onClick={exportPDF}
                aria-label={isPremium ? "Export dashboard as PDF" : "Upgrade for PDF export"}
                className="p-2 rounded-xl bg-warning-foreground/10 hover:bg-warning-foreground/20 transition-colors"
              >
                {isPremium ? <FileDown className="w-5 h-5 text-warning-foreground" /> : <Lock className="w-5 h-5 text-warning-foreground" />}
              </button>
              <button
                onClick={() => navigate("/settings")}
                aria-label="Trust & automation settings"
                className="p-2 rounded-xl bg-warning-foreground/10 hover:bg-warning-foreground/20 transition-colors"
              >
                <SettingsIcon className="w-5 h-5 text-warning-foreground" />
              </button>
            </div>
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
          onClick={() => navigate("/learn")}
          className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left border border-border"
        >
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm">Continue learning</p>
            <p className="text-xs text-muted-foreground truncate">
              {learnSuggestion ? learnSuggestion.label : "All topics complete — nice work!"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {learnDone} of {LEARN_TOTAL_TOPICS} topics completed
            </p>
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

        {/* M-Pesa SMS card — only for new users */}
        {transactions.length < 5 && (
          <div className="bg-card rounded-2xl p-4 shadow-card border-l-4 border-success">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm">Start tracking — paste your M-Pesa SMS</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste any M-Pesa confirmation SMS — we'll extract the transaction automatically.
                </p>
              </div>
            </div>
            <Button className="w-full mt-3" onClick={() => setSmsOpen(true)}>
              <MessageSquareText className="w-4 h-4 mr-1.5" /> Paste M-Pesa SMS
            </Button>
          </div>
        )}

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
          { label: "Risk & Protection", to: "/protection", icon: Shield },
          { label: "Debt Tracker", to: "/debt", icon: TrendingDown },
          { label: "Budget & Expenses", to: "/budget", icon: Wallet },
        ].map(({ label, to, icon: Icon }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 shadow-card"
          >
            <Icon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium flex-1 text-left">{label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* M-Pesa SMS Dialog */}
      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste M-Pesa SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={5}
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              placeholder="e.g. QHJ4X8K2 Confirmed. Ksh500.00 sent to NAIVAS SUPERMARKET on 12/5/26 at 1:35PM. New M-PESA balance is Ksh 2,300.00..."
            />
            <Button className="w-full" onClick={parseSMS} disabled={smsBusy}>
              {smsBusy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Parsing…</> : "Extract & log"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
