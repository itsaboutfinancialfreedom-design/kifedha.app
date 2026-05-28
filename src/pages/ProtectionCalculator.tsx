import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Bell, FileText, ExternalLink, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) => `KES ${Math.max(0, Math.round(n)).toLocaleString()}`;

const providers = [
  { name: "Britam", life: 7500, health: null as number | null, income: 3000 },
  { name: "Jubilee", life: 8000, health: 6500, income: 2500 },
  { name: "ICEA Lion", life: 7000, health: 7000, income: null },
  { name: "AAR", life: null, health: 8000, income: null },
];

export default function ProtectionCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useApp();

  const [annualIncome, setAnnualIncome] = useState(600000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(25000);
  const [dependents, setDependents] = useState(0);
  const [lifeCover, setLifeCover] = useState(0);
  const [healthCover, setHealthCover] = useState(0);
  const [hasIncomeProtection, setHasIncomeProtection] = useState(false);
  const [incomeBenefit, setIncomeBenefit] = useState(0);
  const [debts, setDebts] = useState(0);

  // Autofill from profile + allocations + debts
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: a }, { data: d }] = await Promise.all([
        supabase.from("profiles").select("monthly_income, dependents_count").eq("id", user.id).maybeSingle(),
        supabase.from("user_allocations").select("needs_amount, monthly_income").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_debts").select("amount").eq("user_id", user.id),
      ]);
      if (p?.monthly_income) setAnnualIncome(Number(p.monthly_income) * 12);
      if (typeof p?.dependents_count === "number") setDependents(p.dependents_count);
      if (a?.needs_amount) setMonthlyExpenses(Number(a.needs_amount));
      if (d?.length) setDebts(d.reduce((s, r) => s + Number(r.amount || 0), 0));
    })();
  }, [user]);

  const calc = useMemo(() => {
    const lifeNeed = annualIncome * 10 + debts;
    const lifeGap = Math.max(0, lifeNeed - lifeCover);
    const healthNeed = 3_000_000;
    const healthGap = Math.max(0, healthNeed - healthCover);
    const incomeNeed = monthlyExpenses * 6;
    const incomeGap = Math.max(0, incomeNeed - (hasIncomeProtection ? incomeBenefit * 6 : 0));
    const totalGap = lifeGap + healthGap + incomeGap;

    const lifeCoverage = lifeNeed > 0 ? Math.min(1, lifeCover / lifeNeed) : 1;
    const healthCoverage = Math.min(1, healthCover / healthNeed);
    const incomeCoverage = incomeNeed > 0 ? Math.min(1, (hasIncomeProtection ? incomeBenefit * 6 : 0) / incomeNeed) : 1;
    const score = Math.round(((lifeCoverage + healthCoverage + incomeCoverage) / 3) * 100);

    return { lifeNeed, lifeGap, healthGap, incomeGap, totalGap, score };
  }, [annualIncome, debts, lifeCover, healthCover, monthlyExpenses, hasIncomeProtection, incomeBenefit]);

  const scoreColor = calc.score >= 80 ? "text-success" : calc.score >= 50 ? "text-warning" : "text-danger";
  const scoreLabel = calc.score >= 80 ? "Well protected" : calc.score >= 50 ? "Moderate gaps" : "Critical gap";
  const ringStroke = calc.score >= 80 ? "hsl(var(--success))" : calc.score >= 50 ? "hsl(var(--warning))" : "hsl(var(--danger))";

  const lifePremium = Math.round(((calc.lifeGap / 1_000_000) || 0) * 1500);
  const healthPremium = calc.healthGap > 0 ? 6000 : 0;
  const incomePremium = calc.incomeGap > 0 ? Math.round((calc.incomeGap / 6 / 50_000) * 2000) : 0;

  const save = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Log in to save your assessment." });
      navigate("/auth");
      return;
    }
    const { error } = await supabase.from("user_protection_gaps").insert({
      user_id: user.id,
      life_insurance_gap: calc.lifeGap,
      health_insurance_gap: calc.healthGap,
      income_protection_gap: calc.incomeGap,
      total_gap: calc.totalGap,
      protection_score: calc.score,
      inputs: { annualIncome, monthlyExpenses, dependents, lifeCover, healthCover, hasIncomeProtection, incomeBenefit, debts },
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved to your financial plan" });
  };

  const downloadReport = () => {
    if (!isPremium) {
      toast({ title: "Premium feature", description: "Upgrade to download your protection report." });
      navigate("/advisor/upgrade");
      return;
    }
    const blob = new Blob(
      [`Kifedha Protection Report\n\nScore: ${calc.score}/100 (${scoreLabel})\n\nLife gap: ${fmt(calc.lifeGap)}\nHealth gap: ${fmt(calc.healthGap)}\nIncome gap: ${fmt(calc.incomeGap)}\nTotal gap: ${fmt(calc.totalGap)}\n`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kifedha-protection-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const setReminder = () => {
    const start = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${Date.now()}@kifedha\nDTSTART:${f(start)}\nDTEND:${f(end)}\nSUMMARY:Review insurance protection plan\nEND:VEVENT\nEND:VCALENDAR`;
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "review-protection.ics";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Reminder ready", description: "Add the calendar file to set an annual review." });
  };

  // Ring geometry
  const size = 180, stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">Protection Gap Calculator</h1>
            <p className="text-xs text-muted-foreground">Turn vague advice into concrete numbers</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid gap-6 md:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your current cover</CardTitle>
            <CardDescription>Some values auto-fill from your profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Annual income (KES)</Label>
              <Input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly expenses (KES)</Label>
              <Input type="number" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Number of dependents</Label>
              <Input type="number" value={dependents} onChange={(e) => setDependents(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Current life insurance coverage (KES)
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">Rule of thumb: 10x annual income covers ~10 years of lost earnings while your family adjusts.</TooltipContent>
                </Tooltip>
              </Label>
              <Input type="number" value={lifeCover} onChange={(e) => setLifeCover(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Health insurance annual limit (KES)</Label>
              <Input type="number" value={healthCover} onChange={(e) => setHealthCover(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Outstanding debts (KES)</Label>
              <Input type="number" value={debts} onChange={(e) => setDebts(Number(e.target.value) || 0)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Income protection insurance?</Label>
                <p className="text-xs text-muted-foreground">Pays a monthly benefit if you can't work.</p>
              </div>
              <Switch checked={hasIncomeProtection} onCheckedChange={setHasIncomeProtection} />
            </div>
            {hasIncomeProtection && (
              <div className="space-y-1.5">
                <Label>Monthly benefit amount (KES)</Label>
                <Input type="number" value={incomeBenefit} onChange={(e) => setIncomeBenefit(Number(e.target.value) || 0)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Protection score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
                  <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={ringStroke} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c - (calc.score / 100) * c}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-display text-4xl font-bold ${scoreColor}`}>{calc.score}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <p className={`font-semibold ${scoreColor}`}>{scoreLabel}</p>
              <p className="text-xs text-muted-foreground text-center">
                You're doing better than {Math.max(10, Math.min(90, calc.score - 20))}% of Kenyans.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Your gaps</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Life insurance", gap: calc.lifeGap, premium: lifePremium, hint: "Britam ~1,500/mo per 1M" },
                { label: "Health insurance", gap: calc.healthGap, premium: healthPremium, hint: "NHIF Supa Cover ~6,000/mo" },
                { label: "Income protection", gap: calc.incomeGap, premium: incomePremium, hint: "Jubilee ~2,000/mo per 50K benefit" },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">{row.label} gap</span>
                    <span className="font-display font-bold">{fmt(row.gap)}</span>
                  </div>
                  <Progress value={row.gap > 0 ? 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">Est. premium to close: {fmt(row.premium)}/mo · {row.hint}</p>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-baseline">
                <span className="text-sm font-medium">Total protection gap</span>
                <span className="font-display text-xl font-bold text-danger">{fmt(calc.totalGap)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Providers + education */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Compare & learn</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="providers">
              <TabsList className="mb-4">
                <TabsTrigger value="providers">Providers</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
              </TabsList>
              <TabsContent value="providers">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Life (5M)</TableHead>
                        <TableHead>Health (3M)</TableHead>
                        <TableHead>Income</TableHead>
                        <TableHead>Monthly Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((p) => {
                        const total = (p.life || 0) + (p.health || 0) + (p.income || 0);
                        return (
                          <TableRow key={p.name}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{p.life ? `${p.life.toLocaleString()} KES` : "—"}</TableCell>
                            <TableCell>{p.health ? `${p.health.toLocaleString()} KES` : "—"}</TableCell>
                            <TableCell>{p.income ? `${p.income.toLocaleString()} KES` : "—"}</TableCell>
                            <TableCell className="font-semibold">{total.toLocaleString()} KES</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" asChild>
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(p.name + " Kenya insurance quote")}`} target="_blank" rel="noreferrer">
                                  Get quote <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Indicative premiums for comparison only. Actual quotes vary by age, health and underwriting.</p>
              </TabsContent>
              <TabsContent value="education" className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Why 10× annual income?</h4>
                  <p className="text-muted-foreground">A 10× multiple roughly replaces ten years of earnings — long enough for dependents to adjust, finish school, or for a spouse to rebuild income.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">NHIF vs private insurance</h4>
                  <p className="text-muted-foreground">NHIF (SHA) covers core inpatient and outpatient care nationwide and is mandatory. Private cover layers on bigger inpatient limits, faster service, and outpatient/optical/dental that NHIF caps tightly.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Emergency fund vs income protection</h4>
                  <p className="text-muted-foreground">An emergency fund covers short shocks (1–6 months). Income protection kicks in for long-term disability or illness that stops you earning for years — your savings alone won't last.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6 flex flex-wrap gap-3">
            <Button onClick={save}><FileText className="w-4 h-4" /> Add to financial plan</Button>
            <Button variant="outline" onClick={downloadReport}><Download className="w-4 h-4" /> Download report {!isPremium && "(Premium)"}</Button>
            <Button variant="outline" onClick={setReminder}><Bell className="w-4 h-4" /> Set annual reminder</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
