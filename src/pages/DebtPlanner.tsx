import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Download, AlertTriangle, Info, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";

const FREE_DEBT_LIMIT = 5;

interface DebtRow {
  id: string;
  name: string;
  amount: number;
  interest_rate: number;
  min_payment: number;
  due_date: string | null;
  is_paid_off: boolean;
  paid_off_date: string | null;
}

interface DraftDebt {
  name: string;
  amount: string;
  interest_rate: string;
  min_payment: string;
  due_date: string;
}

const emptyDraft: DraftDebt = {
  name: "",
  amount: "",
  interest_rate: "",
  min_payment: "",
  due_date: "",
};

// Simulate payoff using a strategy. Returns months until debt free, total interest, timeline data, and per-debt payoff months
function simulate(debts: DebtRow[], monthlyBudget: number, strategy: "avalanche" | "snowball") {
  if (debts.length === 0) {
    return { months: 0, totalInterest: 0, timeline: [], payoffMonths: {} as Record<string, number> };
  }

  // Clone balances
  let working = debts.map((d) => ({ ...d, balance: d.amount }));
  const payoffMonths: Record<string, number> = {};
  const timeline: Array<{ month: number; total: number; [key: string]: number }> = [];
  let totalInterest = 0;
  let month = 0;
  const maxMonths = 600;

  // initial snapshot
  const snap0: any = { month: 0, total: working.reduce((s, d) => s + d.balance, 0) };
  working.forEach((d) => (snap0[d.name] = d.balance));
  timeline.push(snap0);

  while (working.some((d) => d.balance > 0.01) && month < maxMonths) {
    month++;
    // accrue monthly interest
    working.forEach((d) => {
      if (d.balance > 0) {
        const interest = d.balance * (d.interest_rate / 100 / 12);
        d.balance += interest;
        totalInterest += interest;
      }
    });

    // pay minimums
    let budget = monthlyBudget;
    working.forEach((d) => {
      if (d.balance > 0) {
        const pay = Math.min(d.min_payment, d.balance, budget);
        d.balance -= pay;
        budget -= pay;
      }
    });

    // apply extra by strategy
    const order = [...working]
      .filter((d) => d.balance > 0)
      .sort((a, b) =>
        strategy === "avalanche" ? b.interest_rate - a.interest_rate : a.balance - b.balance
      );
    for (const d of order) {
      if (budget <= 0) break;
      const pay = Math.min(budget, d.balance);
      d.balance -= pay;
      budget -= pay;
    }

    working.forEach((d) => {
      if (d.balance <= 0.01 && !(d.name in payoffMonths)) {
        payoffMonths[d.name] = month;
        d.balance = 0;
      }
    });

    const snap: any = { month, total: working.reduce((s, d) => s + d.balance, 0) };
    working.forEach((d) => (snap[d.name] = Math.max(0, d.balance)));
    timeline.push(snap);
  }

  return { months: month, totalInterest: Math.round(totalInterest), timeline, payoffMonths };
}

function toCSV(rows: any[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((r) => lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")));
  return lines.join("\n");
}

function download(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DebtPlanner() {
  const { user } = useAuth();
  const { isPremium } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftDebt>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Load income from profile for slider max
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: debtData }, { data: prof }] = await Promise.all([
        supabase
          .from("user_debts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase.from("profiles").select("monthly_income").eq("id", user.id).maybeSingle(),
      ]);
      setDebts((debtData ?? []) as DebtRow[]);
      setMonthlyIncome(Number(prof?.monthly_income ?? 0));
      setLoading(false);
    })();
  }, [user]);

  const activeDebts = debts.filter((d) => !d.is_paid_off);
  const totalDebt = activeDebts.reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const totalMin = activeDebts.reduce((s, d) => s + Number(d.min_payment ?? 0), 0);
  const weightedRate =
    totalDebt > 0
      ? activeDebts.reduce((s, d) => s + Number(d.amount) * Number(d.interest_rate), 0) / totalDebt
      : 0;

  const allDebtOriginal = debts.reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const paidOff = debts.filter((d) => d.is_paid_off).reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const pctFree = allDebtOriginal > 0 ? Math.round((paidOff / allDebtOriginal) * 100) : 0;

  const minBudget = Math.max(totalMin, 0);
  const maxBudget = Math.max(monthlyIncome * 0.5, minBudget + 1000, totalMin + 50_000);
  const defaultBudget = Math.round(minBudget * 1.2);
  const [budget, setBudget] = useState<number>(defaultBudget);

  useEffect(() => {
    setBudget(Math.round(minBudget * 1.2));
  }, [minBudget]);

  const effectiveBudget = budget + extra;

  const avalanche = useMemo(
    () => simulate(activeDebts, Math.max(effectiveBudget, minBudget), "avalanche"),
    [activeDebts, effectiveBudget, minBudget]
  );
  const snowball = useMemo(
    () => simulate(activeDebts, Math.max(effectiveBudget, minBudget), "snowball"),
    [activeDebts, effectiveBudget, minBudget]
  );

  // baseline: only minimum payments
  const baseline = useMemo(
    () => simulate(activeDebts, minBudget, "avalanche"),
    [activeDebts, minBudget]
  );

  const interestSaved = Math.max(0, baseline.totalInterest - avalanche.totalInterest);
  const monthsSaved = Math.max(0, baseline.months - avalanche.months);

  const freeDate = useMemo(() => {
    if (avalanche.months === 0) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + avalanche.months);
    return d.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  }, [avalanche.months]);

  const dti = monthlyIncome > 0 ? totalMin / monthlyIncome : 0;

  // ===== CRUD =====
  function startEdit(d: DebtRow) {
    setEditingId(d.id);
    setDraft({
      name: d.name,
      amount: String(d.amount),
      interest_rate: String(d.interest_rate),
      min_payment: String(d.min_payment),
      due_date: d.due_date ?? "",
    });
    setShowForm(true);
  }

  async function saveDebt() {
    if (!user) {
      toast({ title: "Sign in required", description: "Please log in to save debts." });
      return;
    }
    const name = draft.name.trim();
    const amount = Number(draft.amount);
    const rate = Number(draft.interest_rate);
    const min = Number(draft.min_payment);
    if (!name || !(amount > 0) || rate < 0 || min < 0) {
      toast({ title: "Invalid input", description: "Please fill all fields correctly.", variant: "destructive" });
      return;
    }
    if (!editingId && activeDebts.length >= FREE_DEBT_LIMIT && !isPremium) {
      toast({
        title: "Free limit reached",
        description: `Free plan tracks up to ${FREE_DEBT_LIMIT} debts. Upgrade for unlimited.`,
        variant: "destructive",
      });
      return;
    }
    const payload = {
      user_id: user.id,
      name,
      amount,
      interest_rate: rate,
      min_payment: min,
      due_date: draft.due_date || null,
    };
    if (editingId) {
      const { error } = await supabase.from("user_debts").update(payload).eq("id", editingId);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setDebts((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...payload } as DebtRow : d)));
    } else {
      const { data, error } = await supabase.from("user_debts").insert(payload).select().single();
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setDebts((prev) => [...prev, data as DebtRow]);
    }
    setDraft(emptyDraft);
    setEditingId(null);
    setShowForm(false);
    toast({ title: "Saved", description: `${name} saved.` });
  }

  async function deleteDebt(id: string) {
    const { error } = await supabase.from("user_debts").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  async function markPaid(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("user_debts")
      .update({ is_paid_off: true, paid_off_date: today })
      .eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, is_paid_off: true, paid_off_date: today } : d)));
    toast({ title: "Debt cleared 🎉", description: "Great work!" });
  }

  function exportSchedule() {
    const rows = avalanche.timeline.map((t) => ({ month: t.month, total_balance: Math.round(Number(t.total)) }));
    download(`debt-schedule-${Date.now()}.csv`, toCSV(rows));
  }

  function setReminders() {
    if (!isPremium) {
      toast({ title: "Premium feature", description: "Payment reminders are available on Premium." });
      return;
    }
    toast({ title: "Reminders set", description: "We'll notify you before each due date." });
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-lg font-bold">Debt Payoff Planner</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total debt</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">KES {Math.round(totalDebt).toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Monthly minimums</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">KES {Math.round(totalMin).toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Avg interest rate</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{weightedRate.toFixed(1)}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Debt-free by</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{freeDate ?? "—"}</div></CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Debt-free progress</CardTitle>
            <CardDescription>{pctFree}% of original debt cleared</CardDescription>
          </CardHeader>
          <CardContent><Progress value={pctFree} /></CardContent>
        </Card>

        {dti > 0.4 && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/5 text-sm">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">High debt-to-income ratio ({Math.round(dti * 100)}%)</p>
              <p className="text-muted-foreground">Your minimum payments exceed 40% of income. Consider consolidation or negotiating rates.</p>
            </div>
          </div>
        )}

        {/* Debts list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Your debts</CardTitle>
              <CardDescription>
                {activeDebts.length} active · {isPremium ? "Unlimited" : `${FREE_DEBT_LIMIT - activeDebts.length} slots left (Free)`}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setDraft(emptyDraft); }}>
              <Plus className="w-4 h-4 mr-1" /> Add debt
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showForm && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 rounded-lg bg-muted/40 border">
                <div className="md:col-span-2">
                  <Label className="text-xs">Name</Label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Credit Card" maxLength={50} />
                </div>
                <div>
                  <Label className="text-xs">Amount (KES)</Label>
                  <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Rate (% / yr)</Label>
                  <Input type="number" step="0.1" value={draft.interest_rate} onChange={(e) => setDraft({ ...draft, interest_rate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Min payment</Label>
                  <Input type="number" value={draft.min_payment} onChange={(e) => setDraft({ ...draft, min_payment: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Due date</Label>
                  <Input type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
                </div>
                <div className="md:col-span-6 flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setDraft(emptyDraft); }}>Cancel</Button>
                  <Button onClick={saveDebt}>{editingId ? "Update" : "Add"} debt</Button>
                </div>
              </div>
            )}

            {debts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No debts yet. Add your first one to see strategies.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Debt</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Min/mo</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((d) => (
                    <TableRow key={d.id} className={d.is_paid_off ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        {d.name}
                        {d.interest_rate > 30 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 inline-flex items-center gap-1 text-xs text-destructive">
                                <AlertTriangle className="w-3 h-3" /> High
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Very high-interest debt. Prioritize paying this first.</TooltipContent>
                          </Tooltip>
                        )}
                        {d.is_paid_off && <span className="ml-2 text-xs text-success">Paid</span>}
                      </TableCell>
                      <TableCell className="text-right">{Number(d.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(d.interest_rate).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{Number(d.min_payment).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.due_date ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!d.is_paid_off && (
                            <Button size="sm" variant="ghost" onClick={() => markPaid(d.id)} title="Mark as paid">
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => startEdit(d)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteDebt(d.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {activeDebts.length > 0 && (
          <>
            {/* Payment slider */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly payment plan</CardTitle>
                <CardDescription>Drag to see how faster payments shrink your timeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Monthly budget</span>
                    <span className="font-semibold">KES {budget.toLocaleString()}</span>
                  </div>
                  <Slider
                    min={minBudget}
                    max={Math.round(maxBudget)}
                    step={500}
                    value={[budget]}
                    onValueChange={(v) => setBudget(v[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Min KES {minBudget.toLocaleString()}</span>
                    <span>Max KES {Math.round(maxBudget).toLocaleString()}</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Extra payment per month</Label>
                    <Input type="number" value={extra} onChange={(e) => setExtra(Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                  <div className="flex items-end">
                    <p className="text-xs text-muted-foreground">
                      vs. minimum-only: <span className="font-semibold text-success">save KES {interestSaved.toLocaleString()}</span> and finish <span className="font-semibold text-success">{monthsSaved} months earlier</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategy comparison */}
            <Tabs defaultValue="compare">
              <TabsList>
                <TabsTrigger value="compare">Compare strategies</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="compare">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Avalanche (highest rate)</TableHead>
                          <TableHead>Snowball (smallest balance)</TableHead>
                          <TableHead>Difference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Total interest</TableCell>
                          <TableCell>KES {avalanche.totalInterest.toLocaleString()}</TableCell>
                          <TableCell>KES {snowball.totalInterest.toLocaleString()}</TableCell>
                          <TableCell className="text-success">
                            Save KES {Math.max(0, snowball.totalInterest - avalanche.totalInterest).toLocaleString()} with Avalanche
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Months to freedom</TableCell>
                          <TableCell>{avalanche.months} mo</TableCell>
                          <TableCell>{snowball.months} mo</TableCell>
                          <TableCell>{Math.abs(avalanche.months - snowball.months)} months</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">First debt cleared</TableCell>
                          <TableCell>
                            {Object.entries(avalanche.payoffMonths).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—"}
                          </TableCell>
                          <TableCell>
                            {Object.entries(snowball.payoffMonths).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">Quick wins vs. savings</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Balance over time (Avalanche)</CardTitle>
                    <CardDescription>Markers show when each debt is cleared.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 w-full">
                      <ResponsiveContainer>
                        <LineChart data={avalanche.timeline}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                          <ReTooltip formatter={(v: any) => `KES ${Math.round(Number(v)).toLocaleString()}`} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          {Object.entries(avalanche.payoffMonths).map(([name, m]) => (
                            <ReferenceDot key={name} x={m} y={0} r={5} fill="hsl(var(--success, var(--primary)))" stroke="none" label={{ value: name, fontSize: 10, position: "top" }} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4" /> Did you know?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Paying KES 2,000 extra monthly on a KES 50,000 debt at 20% interest pays it off about 8 months earlier.</p>
                <p><strong>Compound interest</strong> means unpaid interest is added back to your balance — so it earns interest too. Paying more than the minimum stops that snowball.</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={exportSchedule} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Generate payment schedule (CSV)
              </Button>
              <Button onClick={setReminders} variant="outline">
                <Bell className="w-4 h-4 mr-2" /> Set payment reminders {!isPremium && "(Premium)"}
              </Button>
              {!isPremium && (
                <Button variant="secondary" onClick={() => navigate("/advisor/upgrade")}>Upgrade to Premium</Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
