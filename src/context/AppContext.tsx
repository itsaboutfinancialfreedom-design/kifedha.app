import { useState, createContext, useContext, ReactNode, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/context/AuthContext";

export interface UserFinancials {
  monthlyIncome: number;
  expenses: { name: string; amount: number }[];
  totalExpenses: number;
  debts: { name: string; amount: number; interestRate: number; monthlyPayment: number }[];
  totalDebt: number;
  dependents: number;
  goals: { name: string; targetAmount: number; deadline: string }[];
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasEmergencyFund: boolean;
  emergencyFundAmount: number;
}

export interface AutomationSettings {
  autopilotGoals: boolean;
  roundUps: boolean;
  lowBalanceAlerts: boolean;
  subscriptionScan: boolean;
  autoSweepSurplus: boolean;
}

export interface GoalAutopilot {
  goalName: string;
  enabled: boolean;
  monthlyContribution: number;
  simulatedBalance: number;
  lastRunISO: string;
}

export interface FinancialBlueprint {
  allocation: {
    needs: { percent: number; amount: number };
    savings: { percent: number; amount: number };
    investments: { percent: number; amount: number };
    protection: { percent: number; amount: number };
    debtRepayment: { percent: number; amount: number };
  };
  healthScore: number;
  risks: string[];
  opportunities: string[];
  actionPlan: string[];
  riskScore: number;
  insuranceRecommendations: string[];
}

const DEFAULT_AUTOMATION: AutomationSettings = {
  autopilotGoals: false,
  roundUps: false,
  lowBalanceAlerts: true,
  subscriptionScan: true,
  autoSweepSurplus: false,
};


interface AppContextType {
  financials: UserFinancials | null;
  setFinancials: (f: UserFinancials) => void;
  blueprint: FinancialBlueprint | null;
  setBlueprint: (b: FinancialBlueprint) => void;
  isPremium: boolean;
  premiumLoading: boolean;
  trialDaysLeft: number;
  isTrialing: boolean;

  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  automation: AutomationSettings;
  setAutomation: (a: AutomationSettings) => void;
  autopilots: GoalAutopilot[];
  setAutopilots: (a: GoalAutopilot[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [financials, setFinancials] = useState<UserFinancials | null>(() => {
    const saved = localStorage.getItem("ywb_financials");
    return saved ? JSON.parse(saved) : null;
  });
  const [blueprint, setBlueprint] = useState<FinancialBlueprint | null>(() => {
    const saved = localStorage.getItem("ywb_blueprint");
    return saved ? JSON.parse(saved) : null;
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem("ywb_onboarded") === "true";
  });
  const [automation, setAutomationState] = useState<AutomationSettings>(() => {
    const saved = localStorage.getItem("ywb_automation");
    return saved ? { ...DEFAULT_AUTOMATION, ...JSON.parse(saved) } : DEFAULT_AUTOMATION;
  });
  const [autopilots, setAutopilotsState] = useState<GoalAutopilot[]>(() => {
    const saved = localStorage.getItem("ywb_autopilots");
    return saved ? JSON.parse(saved) : [];
  });

  const { user } = useAuth();

  // One-time cleanup of legacy mock-subscription localStorage keys.
  useEffect(() => {
    localStorage.removeItem("ywb_subscription");
    localStorage.removeItem("ywb_premium");
  }, []);

  // Load financials & blueprint from Supabase when user changes
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("financials, blueprint, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.financials) {
          const f = data.financials as unknown as UserFinancials;
          setFinancials(f);
          localStorage.setItem("ywb_financials", JSON.stringify(f));
        }
        if (data.blueprint) {
          const b = data.blueprint as unknown as FinancialBlueprint;
          setBlueprint(b);
          localStorage.setItem("ywb_blueprint", JSON.stringify(b));
        }
        if (data.onboarding_completed) {
          setHasCompletedOnboarding(true);
          localStorage.setItem("ywb_onboarded", "true");
        }
      });
  }, [user?.id]);


  const setAutomation = (a: AutomationSettings) => {
    setAutomationState(a);
    localStorage.setItem("ywb_automation", JSON.stringify(a));
  };
  const setAutopilots = (a: GoalAutopilot[]) => {
    setAutopilotsState(a);
    localStorage.setItem("ywb_autopilots", JSON.stringify(a));
  };

  useEffect(() => {
    if (!automation.autopilotGoals || autopilots.length === 0) return;
    const now = new Date();
    const updated = autopilots.map(ap => {
      if (!ap.enabled) return ap;
      const last = new Date(ap.lastRunISO);
      const daysPassed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPassed <= 0) return ap;
      const dailyAccrual = ap.monthlyContribution / 30;
      return {
        ...ap,
        simulatedBalance: ap.simulatedBalance + dailyAccrual * daysPassed,
        lastRunISO: now.toISOString(),
      };
    });
    if (JSON.stringify(updated) !== JSON.stringify(autopilots)) {
      setAutopilotsState(updated);
      localStorage.setItem("ywb_autopilots", JSON.stringify(updated));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetFinancials = (f: UserFinancials) => {
    setFinancials(f);
    localStorage.setItem("ywb_financials", JSON.stringify(f));
    if (user) {
      supabase
        .from("profiles")
        .update({ financials: f as unknown as never })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.error("Failed to sync financials:", error);
        });
    }
  };
  const handleSetBlueprint = (b: FinancialBlueprint) => {
    setBlueprint(b);
    localStorage.setItem("ywb_blueprint", JSON.stringify(b));
    if (user) {
      supabase
        .from("profiles")
        .update({ blueprint: b as unknown as never })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.error("Failed to sync blueprint:", error);
        });
    }
  };
  const handleSetOnboarded = (v: boolean) => {
    setHasCompletedOnboarding(v);
    localStorage.setItem("ywb_onboarded", v.toString());
  };

  // Server-verified subscription state (source of truth).
  // localStorage is used ONLY as a fast-read cache, written AFTER the server confirms.
  const { user } = useAuth();
  const [dbSub, setDbSub] = useState<{ status: string; current_period_end: string | null; cancel_at_period_end: boolean } | null>(null);
  const [premiumLoading, setPremiumLoading] = useState<boolean>(true);

  const fetchDbSub = useCallback(async () => {
    if (!user) {
      setDbSub(null);
      setPremiumLoading(false);
      localStorage.removeItem("ywb_premium_cache");
      return;
    }
    setPremiumLoading(true);
    const env = getPaddleEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("status,current_period_end,cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setDbSub((data as any) ?? null);
    setPremiumLoading(false);
  }, [user]);

  // Re-verify server-side whenever the authenticated user changes.
  useEffect(() => {
    fetchDbSub();
    if (!user) return;
    const ch = supabase
      .channel(`app-subs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, () => fetchDbSub())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, fetchDbSub]);

  // Premium derived state — driven exclusively by the server-verified subscription row.
  const { isTrialing, trialDaysLeft, isPremium } = useMemo(() => {
    const now = Date.now();
    let dbActive = false;
    let dbTrialing = false;
    let daysLeft = 0;
    if (dbSub) {
      const periodEnd = dbSub.current_period_end ? new Date(dbSub.current_period_end).getTime() : Infinity;
      if (["active", "trialing", "past_due"].includes(dbSub.status)) {
        dbActive = periodEnd === Infinity || periodEnd > now;
      }
      dbTrialing = dbSub.status === "trialing" && periodEnd > now;
      if (dbTrialing) daysLeft = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));
    }
    return { isTrialing: dbTrialing, trialDaysLeft: daysLeft, isPremium: dbActive };
  }, [dbSub]);

  // Write to localStorage cache ONLY after the server confirms — never read as source of truth.
  useEffect(() => {
    if (premiumLoading) return;
    localStorage.setItem("ywb_premium_cache", JSON.stringify({ isPremium, isTrialing, at: Date.now() }));
  }, [isPremium, isTrialing, premiumLoading]);

  return (
    <AppContext.Provider value={{
      financials, setFinancials: handleSetFinancials,
      blueprint, setBlueprint: handleSetBlueprint,
      isPremium, premiumLoading,
      trialDaysLeft, isTrialing,
      hasCompletedOnboarding, setHasCompletedOnboarding: handleSetOnboarded,
      automation, setAutomation,
      autopilots, setAutopilots,
    }}>
      {children}
    </AppContext.Provider>
  );
}


export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
