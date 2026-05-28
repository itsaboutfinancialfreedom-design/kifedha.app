import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, TrendingUp, PiggyBank, ShieldAlert, Target, Sparkles, X, ArrowRight, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Rec {
  id: string;
  tone: "danger" | "warning" | "info" | "success";
  icon: typeof AlertTriangle;
  title: string;
  message: string;
  action: string;
  href: string;
  progress?: number;
}

const DISMISS_KEY = "kifedha_dismissed_recs";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function loadDismissed(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveDismissed(map: Record<string, number>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
}

const toneStyles: Record<Rec["tone"], string> = {
  danger: "border-l-4 border-destructive bg-destructive/5",
  warning: "border-l-4 border-warning bg-warning/5",
  info: "border-l-4 border-primary bg-primary/5",
  success: "border-l-4 border-success bg-success/5",
};

const toneIconBg: Record<Rec["tone"], string> = {
  danger: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-warning",
  info: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
};

export function Recommendations({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [streakMonths, setStreakMonths] = useState(0);
  const [dismissed, setDismissed] = useState<Record<string, number>>(loadDismissed());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: profile }, { data: gaps }, { data: debts }, { data: goals }, { data: risk }, { data: alloc }] = await Promise.all([
        supabase.from("profiles").select("monthly_income").eq("id", user.id).maybeSingle(),
        supabase.from("user_protection_gaps").select("*").eq("user_id", user.id).order("assessed_at", { ascending: false }).limit(1),
        supabase.from("user_debts").select("*").eq("user_id", user.id).eq("is_paid_off", false),
        supabase.from("user_goals").select("*").eq("user_id", user.id),
        supabase.from("user_risk_profiles").select("*").eq("user_id", user.id).order("assessed_at", { ascending: false }).limit(1),
        supabase.from("user_allocations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
      ]);

      const income = Number(profile?.monthly_income ?? 0);
      const latestAlloc = alloc?.[0];
      const savingsRate = latestAlloc ? Number(latestAlloc.savings_percent ?? 0) / 100 : 0;
      const latestRisk = risk?.[0];
      const latestGap = gaps?.[0];

      const list: Rec[] = [];

      // 1. Protection gap
      if (latestGap && Number(latestGap.total_gap) > 1_000_000) {
        list.push({
          id: "protection-gap",
          tone: "danger",
          icon: ShieldAlert,
          title: "Your family is exposed",
          message: `Protection gap of KES ${Math.round(Number(latestGap.total_gap)).toLocaleString()}. Closing it secures your dependents.`,
          action: "Get insurance quotes",
          href: "/tools/protection-calculator",
        });
      }

      // 2. Low savings rate
      if (income > 0 && latestAlloc && savingsRate < 0.1) {
        list.push({
          id: "low-savings",
          tone: "warning",
          icon: PiggyBank,
          title: "Savings rate is low",
          message: `You save only ${Math.round(savingsRate * 100)}% of income. Increasing to 15% could mean retiring years earlier.`,
          action: "Adjust my plan",
          href: "/tools/income-allocator",
          progress: Math.round(savingsRate * 100),
        });
      }

      // 3. High-interest debt
      const highRate = (debts ?? []).find((d: any) => Number(d.interest_rate) > 20);
      if (highRate) {
        list.push({
          id: `debt-${highRate.id}`,
          tone: "danger",
          icon: AlertTriangle,
          title: `${highRate.name} charges ${Number(highRate.interest_rate).toFixed(0)}% interest`,
          message: `Paying KES 3,000 extra monthly could save tens of thousands in interest.`,
          action: "Create payoff plan",
          href: "/tools/debt-planner",
        });
      }

      // 4. Investment opportunity
      if (latestRisk && savingsRate > 0.15) {
        list.push({
          id: "invest-opportunity",
          tone: "info",
          icon: TrendingUp,
          title: `Put your ${latestRisk.risk_level} profile to work`,
          message: "You're saving well — diversify into a portfolio that matches your risk tolerance.",
          action: "View sample portfolio",
          href: "/assessment/risk-profile",
        });
      }

      // 5. Goal progress at risk
      const now = Date.now();
      const stalled = (goals ?? []).find((g: any) => {
        const pct = Number(g.target_amount) > 0 ? Number(g.current_amount) / Number(g.target_amount) : 0;
        const monthsLeft = g.target_date
          ? (new Date(g.target_date).getTime() - now) / (1000 * 60 * 60 * 24 * 30)
          : Infinity;
        return pct < 0.3 && monthsLeft < 12;
      });
      if (stalled) {
        const pct = Math.round((Number(stalled.current_amount) / Number(stalled.target_amount)) * 100);
        list.push({
          id: `goal-${stalled.id}`,
          tone: "warning",
          icon: Target,
          title: `${stalled.goal_type} goal is behind`,
          message: `Only ${pct}% complete with under a year to go. Bump monthly savings to catch up.`,
          action: "Update goal",
          href: "/goals",
          progress: pct,
        });
      }

      // Encouragement fallback
      if (list.length === 0) {
        list.push({
          id: "all-good",
          tone: "success",
          icon: Sparkles,
          title: "You're on track 🎉",
          message: "No urgent action items right now. Keep up the consistent savings.",
          action: "Run a fresh blueprint",
          href: "/tools/income-allocator",
        });
      }

      // Savings streak: count consecutive months with allocation rows updated
      // (lightweight proxy — counts active months)
      setStreakMonths(latestAlloc ? Math.min(24, 1 + Math.floor((Date.now() - new Date(latestAlloc.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0);

      setRecs(list);
      setLoading(false);
    })();
  }, [user]);

  const visible = useMemo(() => {
    const now = Date.now();
    return recs.filter((r) => !dismissed[r.id] || now - dismissed[r.id] > SEVEN_DAYS);
  }, [recs, dismissed]);

  function dismiss(id: string) {
    const next = { ...dismissed, [id]: Date.now() };
    setDismissed(next);
    saveDismissed(next);
  }

  const milestone =
    streakMonths >= 24 ? { label: "Financial Champion", color: "text-premium" } :
    streakMonths >= 12 ? { label: "Wealth Builder", color: "text-premium" } :
    streakMonths >= 6 ? { label: "Consistent Saver", color: "text-success" } :
    streakMonths >= 3 ? { label: "Saver", color: "text-primary" } : null;

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading recommendations…</div>;
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {milestone && (
        <Card className="bg-gradient-to-r from-primary/10 to-premium/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-premium" />
            <div className="flex-1">
              <p className="font-semibold text-sm">🔥 {streakMonths} month savings streak</p>
              <p className="text-xs text-muted-foreground">Badge: <span className={milestone.color}>{milestone.label}</span></p>
            </div>
            <Badge variant="secondary" className="text-xs">Share</Badge>
          </CardContent>
        </Card>
      )}

      {visible.map((r) => {
        const Icon = r.icon;
        return (
          <Card key={r.id} className={toneStyles[r.tone]}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${toneIconBg[r.tone]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.message}</p>
                  {typeof r.progress === "number" && (
                    <div className="mt-2"><Progress value={r.progress} className="h-1.5" /></div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button asChild size="sm" className="h-8">
                      <Link to={r.href}>{r.action} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                    </Button>
                    {r.id !== "all-good" && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => dismiss(r.id)}>
                        <X className="w-3.5 h-3.5 mr-1" /> Dismiss 7 days
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
