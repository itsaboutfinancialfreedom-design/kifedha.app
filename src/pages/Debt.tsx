import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { generateBlueprint } from "@/lib/blueprintEngine";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { TrendingDown, AlertTriangle, CheckCircle2, Zap, ArrowLeft, Plus } from "lucide-react";

function DebtContent() {
  const { financials, blueprint, setFinancials, setBlueprint } = useApp();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: "", type: "Mobile loan (Tala/Branch)", amount: "", interestRate: "", monthlyPayment: "",
  });
  if (!financials || !blueprint) return null;

  const resetForm = () => setNewDebt({
    name: "", type: "Mobile loan (Tala/Branch)", amount: "", interestRate: "", monthlyPayment: "",
  });

  const saveDebt = async () => {
    if (!newDebt.name || !newDebt.amount || !newDebt.monthlyPayment) {
      toast.error("Fill in name, balance, and monthly payment");
      return;
    }
    const debt = {
      name: newDebt.name,
      amount: Number(newDebt.amount),
      interestRate: Number(newDebt.interestRate) || 0,
      monthlyPayment: Number(newDebt.monthlyPayment),
    };
    const updatedDebts = [...(financials?.debts ?? []), debt];
    const updatedFinancials = {
      ...financials!,
      debts: updatedDebts,
      totalDebt: updatedDebts.reduce((s, d) => s + d.amount, 0),
    };
    setFinancials(updatedFinancials);
    setBlueprint(generateBlueprint(updatedFinancials));
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ debts: updatedDebts as never } as never)
        .eq("id", user.id);
      if (error) {
        console.error("Failed to sync debt", error);
        toast.error("Saved locally, but couldn't sync to your account.");
      }
    }
    toast.success("Debt added");
    setAddOpen(false);
    resetForm();
  };

  const income = financials.monthlyIncome ?? 0;
  const debts = financials.debts ?? [];
  const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const totalMonthly = debts.reduce((s, d) => s + (d.monthlyPayment ?? 0), 0);
  const debtToIncomeRatio = income > 0 ? totalMonthly / income : 0;
  const totalDebt = financials.totalDebt ?? debts.reduce((s, d) => s + (d.amount ?? 0), 0);
  const debtBudget = blueprint.allocation?.debtRepayment?.amount ?? 0;

  const getDebtLevel = (ratio: number) => {
    if (ratio > 0.4) return { label: "Dangerous", color: "text-danger", bg: "bg-danger/10" };
    if (ratio > 0.2) return { label: "Moderate", color: "text-warning", bg: "bg-warning/10" };
    return { label: "Manageable", color: "text-success", bg: "bg-success/10" };
  };

  const level = getDebtLevel(debtToIncomeRatio);

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div /> {/* spacer */}
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add debt
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold">Debt Overview</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${level.bg} ${level.color}`}>
            {level.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Debt</p>
            <p className="font-display text-lg font-bold">
              KES {totalDebt.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payments</p>
            <p className="font-display text-lg font-bold">
              KES {totalMonthly.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Debt-to-Income</p>
            <p className={`font-display text-lg font-bold ${level.color}`}>
              {Math.round(debtToIncomeRatio * 100)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget for Debt</p>
            <p className="font-display text-lg font-bold text-primary">
              KES {debtBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>


      {/* Individual debts */}
      <div className="space-y-3">
        {sortedDebts.map((debt, i) => {
          const isHighRate = debt.interestRate > 15;
          // Auto-calculate months to payoff
          const monthlyRate = debt.interestRate / 100 / 12;
          const monthsToPayoff = monthlyRate > 0 && debt.monthlyPayment > debt.amount * monthlyRate
            ? Math.ceil(Math.log(debt.monthlyPayment / (debt.monthlyPayment - debt.amount * monthlyRate)) / Math.log(1 + monthlyRate))
            : Math.ceil(debt.amount / (debt.monthlyPayment || 1));
          const totalInterest = Math.round(debt.monthlyPayment * monthsToPayoff - debt.amount);

          return (
            <div key={i} className={`bg-card rounded-2xl p-5 shadow-card ${isHighRate ? "border-l-4 border-danger" : ""}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-sm">{debt.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    KES {debt.amount.toLocaleString()} balance
                  </p>
                </div>
                {isHighRate && (
                  <span className="flex items-center gap-1 text-xs font-medium text-danger bg-danger/10 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> High Rate
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className={`text-sm font-bold ${isHighRate ? "text-danger" : "text-foreground"}`}>
                    {debt.interestRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-sm font-bold">{monthsToPayoff} mo</p>
                  <p className="text-[10px] text-muted-foreground">To Payoff</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-sm font-bold text-warning">
                    KES {totalInterest.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total Interest</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payoff Strategy */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="font-display text-base font-semibold">Payoff Strategy</h2>
        </div>
        <div className="space-y-3">
          {sortedDebts.length > 0 && (
            <div className="p-3 bg-primary/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Avalanche Method (Recommended)</p>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Pay off <strong>{sortedDebts[0].name}</strong> first ({sortedDebts[0].interestRate}% rate).
                This saves you the most money in interest.
              </p>
            </div>
          )}
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground">
              💡 If you have extra cash, put it towards your highest-interest debt.
              Even KES 1,000 extra/month makes a big difference.
            </p>
          </div>
        </div>
      </div>

      {/* Add debt dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a debt</DialogTitle>
            <DialogDescription>Track a loan or credit balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="debt-name">Debt name</Label>
              <Input
                id="debt-name"
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                placeholder="e.g. Tala loan"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lender type</Label>
              <Select
                value={newDebt.type}
                onValueChange={(v) => setNewDebt({ ...newDebt, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Mobile loan (Tala/Branch)",
                    "Fuliza",
                    "SACCO loan",
                    "Bank loan",
                    "Credit card",
                    "Family & friends",
                    "Other",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-amount">Total balance (KES)</Label>
              <Input
                id="debt-amount"
                inputMode="numeric"
                value={newDebt.amount}
                onChange={(e) => setNewDebt({
                  ...newDebt,
                  amount: e.target.value.replace(/[^0-9]/g, ""),
                })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-monthly">Monthly payment (KES)</Label>
              <Input
                id="debt-monthly"
                inputMode="numeric"
                value={newDebt.monthlyPayment}
                onChange={(e) => setNewDebt({
                  ...newDebt,
                  monthlyPayment: e.target.value.replace(/[^0-9]/g, ""),
                })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-rate">Interest rate % per year</Label>
              <Input
                id="debt-rate"
                inputMode="decimal"
                value={newDebt.interestRate}
                onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })}
                placeholder="e.g. 15"
              />
              <p className="text-[10px] text-muted-foreground">
                If your lender quotes monthly rate, multiply by 12.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={saveDebt}>Save debt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Debt() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Debt Tracker</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4">
        <DebtContent />
      </div>
      <BottomNav />
    </div>
  );
}
