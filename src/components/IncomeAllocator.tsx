import { useEffect, useMemo, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Save, FileDown, Target, Lock, Bell, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";

type Risk = "conservative" | "moderate" | "aggressive";

const COLORS = {
  needs: "#ef4444",
  savings: "#22c55e",
  investments: "#3b82f6",
  protection: "#f59e0b",
};

const TOOLTIPS = {
  needs: "Essential expenses: rent/mortgage, food, utilities, transport, school fees. Keep below 60% of income.",
  savings: "Future goals: emergency fund (3-6 months), retirement, education, major purchases. Aim for ≥20%.",
  investments: "Growth assets: stocks, bonds, mutual funds, SACCOs, business capital. Higher risk = higher return.",
  protection: "Insurance: life (10x annual income), health, income protection — shields you from financial loss.",
};

interface FundPick {
  name: string;
  type: "MMF" | "Bond fund" | "Equity fund" | "ETF" | "SACCO";
  yieldText: string;
  min: string;
  why: string;
  url: string;
}

// Kenya-focused funds. Yields are illustrative and change weekly — always verify before investing.
const KENYA_FUNDS: Record<Risk, FundPick[]> = {
  conservative: [
    { name: "CIC Money Market Fund", type: "MMF", yieldText: "~14% p.a.", min: "KES 5,000", why: "Top-rated MMF, daily liquidity, ideal for emergency fund", url: "https://www.google.com/search?q=CIC+Money+Market+Fund+Kenya" },
    { name: "Sanlam Money Market Fund", type: "MMF", yieldText: "~13% p.a.", min: "KES 2,500", why: "Low entry, regulated by CMA, weekly payouts", url: "https://www.google.com/search?q=Sanlam+Money+Market+Fund+Kenya" },
    { name: "NCBA Fixed Income Fund", type: "Bond fund", yieldText: "~12% p.a.", min: "KES 5,000", why: "Government & corporate bonds, lower volatility than equity", url: "https://www.google.com/search?q=NCBA+Fixed+Income+Fund" },
  ],
  moderate: [
    { name: "Sanlam Balanced Fund", type: "Equity fund", yieldText: "~15% p.a.", min: "KES 2,500", why: "Mix of NSE equities + bonds; smoother ride than pure equity", url: "https://www.google.com/search?q=Sanlam+Balanced+Fund+Kenya" },
    { name: "Britam Bond Fund", type: "Bond fund", yieldText: "~13% p.a.", min: "KES 1,000", why: "Defensive base — pairs well with one equity fund", url: "https://www.google.com/search?q=Britam+Bond+Fund" },
    { name: "Stima SACCO", type: "SACCO", yieldText: "~11% dividend", min: "KES 1,000/mo", why: "Patient capital + cheap loan multiplier when you need credit", url: "https://www.google.com/search?q=Stima+SACCO+Kenya" },
  ],
  aggressive: [
    { name: "ABSA NewGold ETF (NSE)", type: "ETF", yieldText: "Tracks gold price (USD)", min: "1 unit (~KES 9,000)", why: "Hedge against KES weakness, traded on NSE", url: "https://www.google.com/search?q=NewGold+ETF+NSE+Kenya" },
    { name: "Sanlam Equity Fund", type: "Equity fund", yieldText: "~18% p.a. (volatile)", min: "KES 2,500", why: "Diversified NSE blue chips, professionally managed", url: "https://www.google.com/search?q=Sanlam+Equity+Fund+Kenya" },
    { name: "Vanguard S&P 500 (via ETrade/Interactive Brokers)", type: "ETF", yieldText: "~10% USD historical", min: "~USD 100", why: "Global diversification beyond NSE; USD-denominated", url: "https://www.google.com/search?q=VOO+Vanguard+S%26P+500+ETF" },
  ],
};

export function calculateAllocations(
  income: number,
  risk: Risk,
  hasDependents: boolean,
  age?: number,
) {
  let needs = 50, savings = 20, investments = 15, protection = 15;
  if (hasDependents) { protection += 5; savings -= 5; }
  if (age && age > 45) { investments -= 3; savings += 3; }
  if (risk === "aggressive") { investments += 10; savings -= 10; }
  else if (risk === "conservative") { investments -= 5; protection += 5; }

  needs = Math.max(30, Math.min(70, needs));
  savings = Math.max(5, Math.min(40, savings));
  investments = Math.max(0, Math.min(40, investments));
  protection = Math.max(5, Math.min(30, protection));

  const safe = Math.max(0, income);
  return {
    needs, savings, investments, protection,
    needsAmount: (safe * needs) / 100,
    savingsAmount: (safe * savings) / 100,
    investmentsAmount: (safe * investments) / 100,
    protectionAmount: (safe * protection) / 100,
  };
}

const fmt = (n: number) => Math.round(n).toLocaleString();

function InfoIcon({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs"><p className="text-xs">{text}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface Props { embedded?: boolean }

export default function IncomeAllocator({ embedded = false }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isPremium } = useApp();

  const initialIncome = profile?.monthly_income ? Number(profile.monthly_income) : 50000;
  const initialDeps = (profile?.dependents_count ?? 0) > 0;
  const initialRisk: Risk =
    profile?.risk_tolerance === "conservative" || profile?.risk_tolerance === "aggressive"
      ? (profile.risk_tolerance as Risk)
      : "moderate";

  const [income, setIncome] = useState<number>(initialIncome);
  const [incomeStr, setIncomeStr] = useState<string>(initialIncome.toLocaleString());
  const [risk, setRisk] = useState<Risk>(initialRisk);
  const [hasDependents, setHasDependents] = useState<boolean>(initialDeps);
  const [saving, setSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // Sync when profile loads
  useEffect(() => {
    if (profile?.monthly_income) {
      const v = Number(profile.monthly_income);
      setIncome(v);
      setIncomeStr(v.toLocaleString());
    }
    if ((profile?.dependents_count ?? 0) > 0) setHasDependents(true);
    if (profile?.risk_tolerance === "conservative" || profile?.risk_tolerance === "aggressive" || profile?.risk_tolerance === "moderate") {
      setRisk(profile.risk_tolerance as Risk);
    }
  }, [profile]);

  // Load latest saved allocation (overrides profile defaults)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_allocations")
        .select("monthly_income, risk_tolerance, has_dependents")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return;
      const v = Number(data.monthly_income) || 0;
      if (v > 0) { setIncome(v); setIncomeStr(v.toLocaleString()); }
      if (data.risk_tolerance === "conservative" || data.risk_tolerance === "moderate" || data.risk_tolerance === "aggressive") {
        setRisk(data.risk_tolerance as Risk);
      }
      if (typeof data.has_dependents === "boolean") setHasDependents(data.has_dependents);
    })();
  }, [user]);


  const a = useMemo(() => calculateAllocations(income, risk, hasDependents), [income, risk, hasDependents]);

  const pieData = [
    { name: "Needs", value: a.needsAmount, color: COLORS.needs },
    { name: "Savings", value: a.savingsAmount, color: COLORS.savings },
    { name: "Investments", value: a.investmentsAmount, color: COLORS.investments },
    { name: "Protection", value: a.protectionAmount, color: COLORS.protection },
  ];

  const onIncome = (s: string) => {
    const digits = s.replace(/[^0-9]/g, "");
    const n = digits ? parseInt(digits, 10) : 0;
    setIncome(n);
    setIncomeStr(n ? n.toLocaleString() : "");
  };

  const riskIndex = risk === "conservative" ? 0 : risk === "moderate" ? 1 : 2;
  const onRisk = (vals: number[]) => {
    const i = vals[0];
    setRisk(i === 0 ? "conservative" : i === 1 ? "moderate" : "aggressive");
  };

  const savePlan = async () => {
    if (!user) {
      toast.error("Please log in to save your plan");
      navigate("/auth");
      return;
    }
    if (income <= 0) { toast.error("Enter a valid income"); return; }
    setSaving(true);
    const { error } = await supabase.from("user_allocations").insert({
      user_id: user.id,
      needs_percent: a.needs,
      savings_percent: a.savings,
      investments_percent: a.investments,
      protection_percent: a.protection,
      monthly_income: income,
      needs_amount: a.needsAmount,
      savings_amount: a.savingsAmount,
      investments_amount: a.investmentsAmount,
      protection_amount: a.protectionAmount,
      risk_tolerance: risk,
      has_dependents: hasDependents,
    });
    setSaving(false);
    if (error) toast.error("Failed to save plan");
    else toast.success("Plan saved!");
  };

  const exportPDF = async () => {
    if (!isPremium) {
      toast.error("PDF export is a Premium feature");
      navigate("/advisor/upgrade");
      return;
    }
    if (!captureRef.current) return;
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(captureRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = 210;
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("kifedha-financial-blueprint.pdf");
  };

  return (
    <div className={embedded ? "" : "max-w-6xl mx-auto px-4 py-6"}>
      <div ref={captureRef} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Inputs + Pie */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="income">Monthly income (KES, after tax)</Label>
                  <Input
                    id="income"
                    inputMode="numeric"
                    value={incomeStr}
                    onChange={(e) => onIncome(e.target.value)}
                    placeholder="Enter monthly income after tax"
                  />
                  {income <= 0 && <p className="text-xs text-destructive">Income must be greater than 0</p>}
                </div>

                <div className="space-y-3">
                  <Label>Risk tolerance</Label>
                  <Slider min={0} max={2} step={1} value={[riskIndex]} onValueChange={onRisk} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={risk === "conservative" ? "font-semibold text-foreground" : ""}>Conservative</span>
                    <span className={risk === "moderate" ? "font-semibold text-foreground" : ""}>Moderate</span>
                    <span className={risk === "aggressive" ? "font-semibold text-foreground" : ""}>Aggressive</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="deps" className="text-sm leading-snug">
                    I have dependents (children or elderly parents)
                  </Label>
                  <Switch id="deps" checked={hasDependents} onCheckedChange={setHasDependents} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <RTooltip formatter={(v: number) => `${fmt(v)} KES`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown cards */}
          <div className="grid sm:grid-cols-2 gap-4 content-start">
            <BreakdownCard
              title="Needs (Essential)"
              tooltip={TOOLTIPS.needs}
              amount={a.needsAmount}
              percent={a.needs}
              color="needs"
              items={[
                { icon: "🏠", label: "Rent", value: a.needsAmount * 0.4 },
                { icon: "🍎", label: "Food", value: a.needsAmount * 0.25 },
                { icon: "🚗", label: "Transport", value: a.needsAmount * 0.2 },
                { icon: "💡", label: "Utilities", value: a.needsAmount * 0.1 },
                ...(hasDependents ? [{ icon: "📚", label: "School", value: a.needsAmount * 0.05 }] : []),
              ]}
            />
            <BreakdownCard
              title="Savings (Goals)"
              tooltip={TOOLTIPS.savings}
              amount={a.savingsAmount}
              percent={a.savings}
              color="savings"
              items={[
                { icon: "💰", label: "Emergency Fund", value: a.savingsAmount * 0.4 },
                { icon: "🎯", label: "Goals", value: a.savingsAmount * 0.35 },
                { icon: "👵", label: "Retirement", value: a.savingsAmount * 0.25 },
              ]}
            />
            <BreakdownCard
              title="Investments (Growth)"
              tooltip={TOOLTIPS.investments}
              amount={a.investmentsAmount}
              percent={a.investments}
              color="investments"
              items={[
                { icon: "📈", label: "Stocks", value: a.investmentsAmount * 0.5 },
                { icon: "🏢", label: "Bonds", value: a.investmentsAmount * 0.3 },
                { icon: "💼", label: "Business", value: a.investmentsAmount * 0.2 },
              ]}
            />
            <BreakdownCard
              title="Protection (Insurance)"
              tooltip={TOOLTIPS.protection}
              amount={a.protectionAmount}
              percent={a.protection}
              color="protection"
              items={[
                { icon: "🛡️", label: "Life Insurance", value: a.protectionAmount * 0.5 },
                { icon: "🏥", label: "Health Insurance", value: a.protectionAmount * 0.3 },
                { icon: "⚕️", label: "Emergency Medical", value: a.protectionAmount * 0.2 },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <Button onClick={savePlan} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save This Plan"}
        </Button>
        <Button variant="outline" onClick={exportPDF}>
          {isPremium ? <FileDown className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
          Export as PDF
        </Button>
        <Button variant="secondary" onClick={() => navigate("/goals")}>
          <Target className="h-4 w-4 mr-2" />Adjust My Goals
        </Button>
      </div>
    </div>
  );
}

type ColorKey = "needs" | "savings" | "investments" | "protection";
const COLOR_CLASSES: Record<ColorKey, string> = {
  needs: "border-l-4 border-l-[#ef4444]",
  savings: "border-l-4 border-l-[#22c55e]",
  investments: "border-l-4 border-l-[#3b82f6]",
  protection: "border-l-4 border-l-[#f59e0b]",
};

function BreakdownCard({
  title, tooltip, amount, percent, color, items,
}: {
  title: string;
  tooltip: string;
  amount: number;
  percent: number;
  color: ColorKey;
  items: { icon: string; label: string; value: number }[];
}) {
  return (
    <Card className={COLOR_CLASSES[color]}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          <InfoIcon text={tooltip} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-xl font-bold">{fmt(amount)} <span className="text-xs font-normal text-muted-foreground">KES</span></p>
          <p className="text-xs text-muted-foreground">{percent}% of income</p>
        </div>
        <ul className="space-y-1 text-xs">
          {items.map((it) => (
            <li key={it.label} className="flex justify-between">
              <span>{it.icon} {it.label}</span>
              <span className="font-medium">{fmt(it.value)} KES</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
