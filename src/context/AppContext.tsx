import { useState, createContext, useContext, ReactNode } from "react";

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

interface AppContextType {
  financials: UserFinancials | null;
  setFinancials: (f: UserFinancials) => void;
  blueprint: FinancialBlueprint | null;
  setBlueprint: (b: FinancialBlueprint) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
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
    localStorage.setItem("akilifi_premium", v.toString());
  };

  const handleSetOnboarded = (v: boolean) => {
    setHasCompletedOnboarding(v);
    localStorage.setItem("akilifi_onboarded", v.toString());
  };

  return (
    <AppContext.Provider value={{
      financials, setFinancials: handleSetFinancials,
      blueprint, setBlueprint: handleSetBlueprint,
      isPremium, setIsPremium: handleSetPremium,
      hasCompletedOnboarding, setHasCompletedOnboarding: handleSetOnboarded,
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
