import { useState, createContext, useContext, ReactNode, useEffect } from "react";

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
  autopilotGoals: boolean;       // self-driving money allocation
  roundUps: boolean;              // simulated round-up savings
  lowBalanceAlerts: boolean;      // proactive warnings
  subscriptionScan: boolean;      // detect duplicate / unused subs
  autoSweepSurplus: boolean;      // move idle cash to high-yield
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
  setIsPremium: (v: boolean) => void;
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
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem("ywb_premium") === "true";
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

  const setAutomation = (a: AutomationSettings) => {
    setAutomationState(a);
    localStorage.setItem("ywb_automation", JSON.stringify(a));
  };
  const setAutopilots = (a: GoalAutopilot[]) => {
    setAutopilotsState(a);
    localStorage.setItem("ywb_autopilots", JSON.stringify(a));
  };

  // Self-driving money: simulate autopilot accruals on each session if enabled
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

  const handleSetPremium = (v: boolean) => {
    setIsPremium(v);
    localStorage.setItem("ywb_premium", v.toString());
  };

  const handleSetOnboarded = (v: boolean) => {
    setHasCompletedOnboarding(v);
    localStorage.setItem("ywb_onboarded", v.toString());
  };

  return (
    <AppContext.Provider value={{
      financials, setFinancials: handleSetFinancials,
      blueprint, setBlueprint: handleSetBlueprint,
      isPremium, setIsPremium: handleSetPremium,
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
