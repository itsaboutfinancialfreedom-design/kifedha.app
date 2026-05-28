import { useState, createContext, useContext, ReactNode, useEffect, useMemo } from "react";

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

export type BillingCycle = "monthly" | "yearly";

export interface Subscription {
  paid: boolean;            // user has an active paid plan (mock)
  cycle: BillingCycle | null;
  trialEndsAt: string | null; // ISO; if in future → treated as premium
  startedAt: string | null;
}

const DEFAULT_AUTOMATION: AutomationSettings = {
  autopilotGoals: false,
  roundUps: false,
  lowBalanceAlerts: true,
  subscriptionScan: true,
  autoSweepSurplus: false,
};

const DEFAULT_SUB: Subscription = {
  paid: false,
  cycle: null,
  trialEndsAt: null,
  startedAt: null,
};

interface AppContextType {
  financials: UserFinancials | null;
  setFinancials: (f: UserFinancials) => void;
  blueprint: FinancialBlueprint | null;
  setBlueprint: (b: FinancialBlueprint) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  subscription: Subscription;
  startTrial: (cycle: BillingCycle) => void;
  cancelSubscription: () => void;
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
  const [subscription, setSubscriptionState] = useState<Subscription>(() => {
    const saved = localStorage.getItem("ywb_subscription");
    if (saved) return { ...DEFAULT_SUB, ...JSON.parse(saved) };
    // Back-compat: previous flag
    const legacy = localStorage.getItem("ywb_premium") === "true";
    return { ...DEFAULT_SUB, paid: legacy };
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

  const persistSub = (s: Subscription) => {
    setSubscriptionState(s);
    localStorage.setItem("ywb_subscription", JSON.stringify(s));
    localStorage.setItem("ywb_premium", String(s.paid));
  };

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
  };
  const handleSetBlueprint = (b: FinancialBlueprint) => {
    setBlueprint(b);
    localStorage.setItem("ywb_blueprint", JSON.stringify(b));
  };
  const handleSetOnboarded = (v: boolean) => {
    setHasCompletedOnboarding(v);
    localStorage.setItem("ywb_onboarded", v.toString());
  };

  // Trial / premium derived state
  const { isTrialing, trialDaysLeft, isPremium } = useMemo(() => {
    const now = Date.now();
    const ends = subscription.trialEndsAt ? new Date(subscription.trialEndsAt).getTime() : 0;
    const trialing = ends > now;
    const daysLeft = trialing ? Math.max(0, Math.ceil((ends - now) / (1000 * 60 * 60 * 24))) : 0;
    return {
      isTrialing: trialing,
      trialDaysLeft: daysLeft,
      isPremium: subscription.paid || trialing,
    };
  }, [subscription]);

  const startTrial = (cycle: BillingCycle) => {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    persistSub({
      paid: true, // mock: simulate successful subscription
      cycle,
      trialEndsAt: trialEnds.toISOString(),
      startedAt: now.toISOString(),
    });
  };

  const cancelSubscription = () => {
    persistSub({ ...DEFAULT_SUB });
  };

  const setIsPremium = (v: boolean) => {
    if (v && !subscription.paid) startTrial("monthly");
    else if (!v) cancelSubscription();
  };

  return (
    <AppContext.Provider value={{
      financials, setFinancials: handleSetFinancials,
      blueprint, setBlueprint: handleSetBlueprint,
      isPremium, setIsPremium,
      subscription, startTrial, cancelSubscription,
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
