import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useTransactions, Transaction } from "@/context/TransactionsContext";
import { CATEGORIES } from "@/lib/categorize";
import { useT } from "@/hooks/useT";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Download, Printer, Lock, FileText, Wallet, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { generateNetWorthSnapshot, generateMonthlyPL } from "@/utils/pdfGenerator";

const PIE_COLORS = ["#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16","#6366f1","#06b6d4","#a855f7","#64748b"];

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Reports() {
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { t } = useT();
  const { isPremium } = useApp();
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState<null | "csv" | "nw" | "pl">(null);

  // Last 6 months income vs expense
  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(ymKey(d), {
        month: d.toLocaleString(undefined, { month: "short" }),
        income: 0, expense: 0,
      });
    }
    transactions.forEach(tx => {
      const k = ymKey(new Date(tx.date));
      const e = map.get(k);
      if (e) e[tx.type] += tx.amount;
    });
    return Array.from(map.values());
  }, [transactions]);

  // This month by category
  const byCategory = useMemo(() => {
    const now = new Date();
    const totals: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === "expense"
        && new Date(tx.date).getMonth() === now.getMonth()
        && new Date(tx.date).getFullYear() === now.getFullYear())
      .forEach(tx => { totals[tx.category] = (totals[tx.category] || 0) + tx.amount; });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Suggested budgets: avg of last 3 full months per category
  const suggested = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(ymKey(d));
    }
    const sums: Record<string, number> = {};
    const counts: Record<string, Set<string>> = {};
    transactions
      .filter(tx => tx.type === "expense" && months.includes(ymKey(new Date(tx.date))))
      .forEach(tx => {
        sums[tx.category] = (sums[tx.category] || 0) + tx.amount;
        (counts[tx.category] ||= new Set()).add(ymKey(new Date(tx.date)));
      });
    return CATEGORIES
      .filter(c => sums[c])
      .map(c => ({ category: c, suggested: Math.round(sums[c] / 3) }))
      .sort((a, b) => b.suggested - a.suggested);
  }, [transactions]);

  function gateOrRun(kind: "csv" | "nw" | "pl", fn: () => Promise<void> | void) {
    if (!isPremium) {
      toast.error("Premium feature", { description: "Upgrade to unlock report exports." });
      navigate("/advisor/upgrade");
      return;
    }
    setBusy(kind);
    Promise.resolve(fn()).finally(() => setBusy(null));
  }

  function exportCSV() {
    const rows: string[] = ["Date,Type,Amount,Category,Note,Source"];
    transactions.forEach((tx: Transaction) => {
      rows.push([
        new Date(tx.date).toISOString(),
        tx.type,
        tx.amount,
        tx.category,
        `"${(tx.note || "").replace(/"/g, '""')}"`,
        tx.source || "manual",
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kifedha-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  async function downloadNetWorth() {
    if (!user) return;
    await generateNetWorthSnapshot({
      userId: user.id,
      userName: profile?.full_name ?? null,
      userEmail: user.email ?? null,
    });
    toast.success("Net worth snapshot downloaded");
  }

  async function downloadMonthlyPL() {
    if (!user) return;
    await generateMonthlyPL(
      {
        userId: user.id,
        userName: profile?.full_name ?? null,
        userEmail: user.email ?? null,
      },
      transactions,
    );
    toast.success("Monthly P&L downloaded");
  }

  return (
    <div className="min-h-screen bg-background pb-28 print:pb-0">
      <div className="gradient-gold px-4 pt-8 pb-8 rounded-b-3xl print:hidden">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-warning-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-warning-foreground">{t("reports")}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Premium reports */}
        <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold">Premium reports</h2>
              <p className="text-xs text-muted-foreground">Download polished PDFs and your full data.</p>
            </div>
            {!isPremium && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full gradient-premium text-premium-foreground">PRO</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              disabled={busy === "nw"}
              onClick={() => gateOrRun("nw", downloadNetWorth)}
            >
              {busy === "nw" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isPremium ? <Wallet className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Net worth snapshot (PDF)
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy === "pl"}
              onClick={() => gateOrRun("pl", downloadMonthlyPL)}
            >
              {busy === "pl" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isPremium ? <FileText className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Monthly P&amp;L statement (PDF)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => gateOrRun("csv", exportCSV)}
            >
              {isPremium ? <Download className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {t("export_csv")} — all transactions
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print this page
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold mb-3">{t("month_over_month")}</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold mb-3">{t("by_category")}</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No expenses this month.</p>
          ) : (
            <div className="h-60">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label={(e: any) => e.name}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold mb-3">{t("suggested_budgets")}</h2>
          {suggested.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Log a few months of expenses to get budget suggestions.
            </p>
          ) : (
            <div className="space-y-2">
              {suggested.map(s => (
                <div key={s.category} className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                  <span className="text-sm font-medium">{s.category}</span>
                  <span className="text-sm font-bold">KES {s.suggested.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
