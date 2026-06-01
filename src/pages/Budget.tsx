import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";

import { Wallet, PiggyBank, TrendingUp, Shield, GraduationCap, Landmark, Sunset, ArrowLeft } from "lucide-react";

function BudgetContent() {
  const { financials, blueprint } = useApp();
  if (!financials || !blueprint) return null;

  const income = financials.monthlyIncome ?? 0;
  const { allocation } = blueprint;
  const safe = (n: number | null | undefined) => (n ?? 0).toLocaleString();

  const wallets = [
    { icon: GraduationCap, label: "School Fees", suggested: Math.round((allocation.savings.amount ?? 0) * 0.3) },
    { icon: Landmark, label: "Land / Property", suggested: Math.round((allocation.investments.amount ?? 0) * 0.4) },
    { icon: Sunset, label: "Retirement", suggested: Math.round((allocation.investments.amount ?? 0) * 0.3) },
    { icon: PiggyBank, label: "Emergency Fund", suggested: Math.round((allocation.savings.amount ?? 0) * 0.5) },
    { icon: Shield, label: "Insurance", suggested: allocation.protection.amount ?? 0 },
  ];

  const splitItems = [
    { label: "Expenses", amount: allocation.needs.amount, pct: allocation.needs.percent, color: "bg-primary" },
    { label: "Savings", amount: allocation.savings.amount, pct: allocation.savings.percent, color: "bg-success" },
    { label: "Investments", amount: allocation.investments.amount, pct: allocation.investments.percent, color: "bg-accent" },
    { label: "Insurance", amount: allocation.protection.amount, pct: allocation.protection.percent, color: "gradient-premium" },
  ];

  return (
    <div className="space-y-4">
      {/* Auto-split */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="font-display text-base font-semibold">Auto-Split Income</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          KES {safe(income)}/month automatically allocated:
        </p>
        <div className="space-y-3">
          {splitItems.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm flex-1">{item.label}</span>
              <span className="text-sm font-semibold">KES {safe(item.amount)}</span>
              <span className="text-xs text-muted-foreground w-10 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Wallets */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-success" />
          <h2 className="font-display text-base font-semibold">Goal-Based Wallets</h2>
        </div>
        <div className="space-y-3">
          {wallets.map(({ icon: Icon, label, suggested }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">Suggested: KES {safe(suggested)}/mo</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Tracker */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h2 className="font-display text-base font-semibold mb-4">Expense Tracker</h2>
        <div className="space-y-2">
          {financials.expenses.map((exp, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm">{exp.name}</span>
              <span className="text-sm font-semibold">KES {safe(exp.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 pt-2 border-t border-border">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-bold text-primary">
            KES {safe(financials.totalExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Budget() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Budget & Expenses</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4">
        <BudgetContent />
      </div>
      <BottomNav />
    </div>
  );
}
