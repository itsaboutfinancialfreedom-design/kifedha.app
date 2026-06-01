import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { generateBlueprint } from "@/lib/blueprintEngine";

import {
  Wallet,
  PiggyBank,
  TrendingUp,
  Shield,
  GraduationCap,
  Landmark,
  Sunset,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";

function BudgetContent() {
  const { financials, blueprint, setFinancials, setBlueprint } = useApp();
  const { user } = useAuth();

  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [adding, setAdding] = useState(false);

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

  const persistExpenses = async (expenses: { name: string; amount: number }[]) => {
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const updated = { ...financials, expenses, totalExpenses };
    const newBlueprint = generateBlueprint(updated);
    setFinancials(updated);
    setBlueprint(newBlueprint);

    if (user) {
      const { error } = await supabase
        .from("profiles")
        // expenses is a JSON column on profiles
        .update({ expenses: expenses as never } as never)
        .eq("id", user.id);
      if (error) {
        console.error("Failed to persist expenses", error);
        toast.error("Saved locally, but couldn't sync to your account.");
      }
    }
  };

  const startEdit = (i: number) => {
    const exp = financials.expenses[i];
    setEditIdx(i);
    setEditName(exp.name);
    setEditAmount(String(exp.amount));
    setAdding(false);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditName("");
    setEditAmount("");
  };

  const saveEdit = async (i: number) => {
    const name = editName.trim();
    const amount = Number(editAmount);
    if (!name || !Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid name and amount.");
      return;
    }
    const next = [...financials.expenses];
    next[i] = { name, amount };
    await persistExpenses(next);
    cancelEdit();
    toast.success("Expense updated");
  };

  const removeExpense = async (i: number) => {
    const next = financials.expenses.filter((_, idx) => idx !== i);
    await persistExpenses(next);
    if (editIdx === i) cancelEdit();
    toast.success("Expense removed");
  };

  const startAdd = () => {
    setAdding(true);
    setEditIdx(null);
    setEditName("");
    setEditAmount("");
  };

  const saveAdd = async () => {
    const name = editName.trim();
    const amount = Number(editAmount);
    if (!name || !Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid name and amount.");
      return;
    }
    const next = [...financials.expenses, { name, amount }];
    await persistExpenses(next);
    setAdding(false);
    setEditName("");
    setEditAmount("");
    toast.success("Expense added");
  };

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
            <div
              key={i}
              className="flex items-center gap-2 py-2 border-b border-border last:border-0"
            >
              {editIdx === i ? (
                <>
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Name"
                    className="h-8 flex-1"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    placeholder="KES"
                    className="h-8 w-24"
                  />
                  <button
                    onClick={() => saveEdit(i)}
                    aria-label="Save"
                    className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    aria-label="Cancel"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm flex-1 truncate">{exp.name}</span>
                  <span className="text-sm font-semibold">KES {safe(exp.amount)}</span>
                  <button
                    onClick={() => startEdit(i)}
                    aria-label="Edit expense"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeExpense(i)}
                    aria-label="Delete expense"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}

          {adding && (
            <div className="flex items-center gap-2 py-2 border-b border-border last:border-0">
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Name"
                className="h-8 flex-1"
              />
              <Input
                type="number"
                inputMode="numeric"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                placeholder="KES"
                className="h-8 w-24"
              />
              <button
                onClick={saveAdd}
                aria-label="Save"
                className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setEditName("");
                  setEditAmount("");
                }}
                aria-label="Cancel"
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-3 pt-2 border-t border-border">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-bold text-primary">
            KES {safe(financials.totalExpenses)}
          </span>
        </div>

        {!adding && (
          <button
            onClick={startAdd}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl
              border border-dashed border-border text-sm text-muted-foreground
              hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add expense
          </button>
        )}
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
