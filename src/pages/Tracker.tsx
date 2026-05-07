import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useTransactions } from "@/context/TransactionsContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, Sparkles, Mic, Loader2 } from "lucide-react";
import { CATEGORIES, Category, autoCategorize } from "@/lib/categorize";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const QUICK_EXPENSE_CATS: Category[] = ["Food", "Transport", "Bills", "Airtime & Data", "Shopping", "Health"];

export default function Tracker() {
  const navigate = useNavigate();
  const { financials } = useApp();
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [autoCat, setAutoCat] = useState(true);

  const monthIncome = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === "income" && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const monthExpenses = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === "expense" && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const baseIncome = financials?.monthlyIncome ?? 0;
  const effectiveIncome = Math.max(baseIncome, monthIncome);
  const balance = effectiveIncome - monthExpenses;

  // Safe to spend today: remaining balance / days left in month, minus a 10% buffer
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const safeToday = Math.max(0, Math.floor((balance * 0.9) / daysLeft));

  const recent = transactions.slice(0, 5);

  function quickAdd(cat: Category) {
    setType("expense");
    setCategory(cat);
    setAutoCat(false);
    setNote(cat);
    setAmount("");
    setOpen(true);
  }

  function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addTransaction({
      type,
      amount: amt,
      note: note.trim() || category,
      date: new Date().toISOString(),
      category: autoCat ? autoCategorize(note) : category,
      source: "manual",
    });
    toast.success(`${type === "income" ? "Income" : "Expense"} logged`);
    setOpen(false);
    setAmount("");
    setNote("");
    setCategory("Other");
    setAutoCat(true);
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="gradient-gold px-4 pt-8 pb-10 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <p className="text-warning-foreground/70 text-sm font-medium">Habari 👋</p>
          <h1 className="font-display text-2xl font-bold text-warning-foreground mt-1">Kifedha Tracker</h1>

          <div className="mt-5 bg-warning-foreground/10 rounded-2xl p-4">
            <p className="text-warning-foreground/70 text-xs">Current balance this month</p>
            <p className="font-display text-3xl font-bold text-warning-foreground mt-1">
              KES {balance.toLocaleString()}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning-foreground" />
              <p className="text-warning-foreground text-sm">
                Safe to spend today: <span className="font-bold">KES {safeToday.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Quick add chips */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold">Quick log</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log a transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={type === "expense" ? "default" : "outline"}
                      onClick={() => setType("expense")}
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-1" /> Expense
                    </Button>
                    <Button
                      variant={type === "income" ? "default" : "outline"}
                      onClick={() => setType("income")}
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-1" /> Income
                    </Button>
                  </div>
                  <div>
                    <Label>Amount (KES)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Input
                      value={note}
                      onChange={e => {
                        setNote(e.target.value);
                        if (autoCat) setCategory(autoCategorize(e.target.value));
                      }}
                      placeholder="e.g. Lunch at Naivas"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Category {autoCat && <span className="text-xs text-muted-foreground">(auto)</span>}</Label>
                      <button
                        type="button"
                        onClick={() => setAutoCat(!autoCat)}
                        className="text-xs text-primary"
                      >
                        {autoCat ? "Pick manually" : "Auto-detect"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {CATEGORIES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCategory(c); setAutoCat(false); }}
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            category === c
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={submit}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_EXPENSE_CATS.map(c => (
              <button
                key={c}
                onClick={() => quickAdd(c)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 border border-border"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>

        {/* Month summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Income (this month)</p>
            <p className="font-display font-bold text-success">KES {monthIncome.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Spent (this month)</p>
            <p className="font-display font-bold text-danger">KES {monthExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold mb-3">Recent transactions</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No transactions yet. Tap <span className="font-semibold">Add</span> to log your first one.
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    t.type === "income" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}>
                    {t.type === "income" ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.note}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.category} · {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "-"}KES {t.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    aria-label="Delete"
                    className="p-1 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-card rounded-2xl p-4 shadow-card text-sm font-medium text-left border border-border"
        >
          View Wealth Blueprint →
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
