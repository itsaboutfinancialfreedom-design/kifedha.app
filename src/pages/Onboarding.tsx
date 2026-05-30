import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

type Frequency = "monthly" | "bi-weekly" | "weekly";
type Stability = "stable" | "unstable" | "freelance";
type Priority = "High" | "Medium" | "Low";

interface DebtRow {
  name: string;
  amount: string;
  interest_rate: string;
  min_payment: string;
}
interface GoalRow {
  goal_type: string;
  target_amount: string;
  target_date: string; // yyyy-mm
  priority: Priority;
}

const GOAL_TYPES = [
  "Emergency fund",
  "School fees",
  "Retirement",
  "House deposit",
  "Business capital",
  "Vacation",
];

const RISK_QUIZ = [
  {
    q: "If your investment dropped 20% in a month, you would:",
    options: [
      { label: "Sell immediately to stop losses", score: 1 },
      { label: "Wait and watch closely", score: 2 },
      { label: "Buy more at a discount", score: 3 },
    ],
  },
  {
    q: "Which return profile sounds most like you?",
    options: [
      { label: "Steady 5% with no losses", score: 1 },
      { label: "8–12% with small swings", score: 2 },
      { label: "15%+ with bigger swings", score: 3 },
    ],
  },
  {
    q: "Your investment time horizon is:",
    options: [
      { label: "Under 2 years", score: 1 },
      { label: "2 – 7 years", score: 2 },
      { label: "Over 7 years", score: 3 },
    ],
  },
] as const;

const COUNTRIES = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Nigeria",
  "Ghana",
  "South Africa",
  "United Kingdom",
  "United States",
  "Other",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — demographics
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("Kenya");

  // Step 1
  const [income, setIncome] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [stability, setStability] = useState<Stability>("stable");

  // Step 2
  const [dependents, setDependents] = useState("0");
  const [ages, setAges] = useState<string[]>([]);
  const [supportsElderly, setSupportsElderly] = useState(false);

  // Step 3
  const [debts, setDebts] = useState<DebtRow[]>([]);

  // Step 4
  const [goals, setGoals] = useState<GoalRow[]>([
    { goal_type: "Emergency fund", target_amount: "", target_date: "", priority: "High" },
  ]);

  // Step 5
  const [answers, setAnswers] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
    if (profile?.onboarding_completed) navigate("/dashboard", { replace: true });

  }, [user, profile, loading, navigate]);

  const depCount = Math.max(0, parseInt(dependents || "0", 10));
  useEffect(() => {
    setAges((prev) => {
      const next = [...prev];
      while (next.length < depCount) next.push("");
      next.length = depCount;
      return next;
    });
  }, [depCount]);

  const addDebt = () =>
    setDebts((d) => [...d, { name: "", amount: "", interest_rate: "", min_payment: "" }]);
  const removeDebt = (i: number) => setDebts((d) => d.filter((_, idx) => idx !== i));
  const updateDebt = (i: number, k: keyof DebtRow, v: string) =>
    setDebts((d) => d.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  const addGoal = () => {
    if (goals.length >= 2) {
      toast.info("Free plan allows 2 goals. Unlock more with Premium.");
      return;
    }
    setGoals((g) => [
      ...g,
      { goal_type: "School fees", target_amount: "", target_date: "", priority: "Medium" },
    ]);
  };
  const removeGoal = (i: number) => setGoals((g) => g.filter((_, idx) => idx !== i));
  const updateGoal = (i: number, k: keyof GoalRow, v: string) =>
    setGoals((g) => g.map((row, idx) => (idx === i ? { ...row, [k]: v as never } : row)));

  const riskTotal = useMemo(
    () => answers.reduce((s, a, i) => s + (RISK_QUIZ[i].options[a]?.score ?? 0), 0),
    [answers]
  );
  const riskTolerance =
    riskTotal <= 4 ? "Conservative" : riskTotal <= 7 ? "Balanced" : "Aggressive";

  const canNext = (): boolean => {
    if (step === 0) {
      const a = Number(age);
      return Number.isFinite(a) && a >= 13 && a <= 120 && !!country;
    }
    if (step === 1) return Number(income) > 0;
    if (step === 2) return depCount >= 0 && ages.every((a, i) => (i < depCount ? a !== "" : true));
    if (step === 3) return debts.every((d) => d.name && Number(d.amount) >= 0);
    if (step === 4)
      return goals.length > 0 && goals.every((g) => g.goal_type && Number(g.target_amount) > 0);
    return true;
  };

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          age: Number(age) || null,
          country,
          monthly_income: Number(income),
          income_frequency: frequency,
          income_stability: stability,
          dependents_count: depCount,
          dependents_ages: ages.map((a) => Number(a)).filter((n) => !Number.isNaN(n)),
          supports_elderly: supportsElderly,
          risk_tolerance: riskTolerance,
          risk_score: riskTotal,
          onboarding_completed: true,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      if (debts.length) {
        const { error: dErr } = await supabase.from("user_debts").insert(
          debts.map((d) => ({
            user_id: user.id,
            name: d.name,
            amount: Number(d.amount) || 0,
            interest_rate: Number(d.interest_rate) || 0,
            min_payment: Number(d.min_payment) || 0,
          }))
        );
        if (dErr) throw dErr;
      }

      if (goals.length) {
        const { error: gErr } = await supabase.from("user_goals").insert(
          goals.map((g) => ({
            user_id: user.id,
            goal_type: g.goal_type,
            target_amount: Number(g.target_amount) || 0,
            target_date: g.target_date ? `${g.target_date}-01` : null,
            priority: g.priority,
            is_premium_feature: false,
          }))
        );
        if (gErr) throw gErr;
      }

      await refreshProfile();
      toast.success("You're all set!");
      navigate("/dashboard", { replace: true });

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-gold px-6 pt-10 pb-6 rounded-b-[2rem]">
        <div className="max-w-lg mx-auto">
          <p className="text-warning-foreground/80 text-sm font-medium">Step {step + 1} of 6</p>
          <h1 className="font-display text-2xl font-bold text-warning-foreground mt-1">
            {step === 0 && "A bit about you"}
            {step === 1 && "Tell us about your income"}
            {step === 2 && "Who depends on you?"}
            {step === 3 && "Any existing debts?"}
            {step === 4 && "Your financial goals"}
            {step === 5 && "Your risk comfort"}
          </h1>
          <Progress value={((step + 1) / 6) * 100} className="mt-4 h-2 bg-warning-foreground/20" />
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="age">Your age</Label>
              <Input
                id="age"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                placeholder="e.g. 32"
                className="mt-1 text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We use this to tailor retirement, protection and risk advice.
              </p>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Currency, products and tax assumptions default to Kenya.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="income">Monthly income after tax (KES)</Label>
              <Input
                id="income"
                inputMode="numeric"
                value={income}
                onChange={(e) => setIncome(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="80,000"
                className="mt-1 text-lg"
              />
            </div>
            <div>
              <Label>Income frequency</Label>
              <RadioGroup
                value={frequency}
                onValueChange={(v) => setFrequency(v as Frequency)}
                className="mt-2 grid grid-cols-3 gap-2"
              >
                {(["monthly", "bi-weekly", "weekly"] as Frequency[]).map((f) => (
                  <label
                    key={f}
                    className={`border rounded-xl p-3 text-center text-sm capitalize cursor-pointer ${
                      frequency === f ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={f} className="sr-only" />
                    {f}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Income stability</Label>
              <RadioGroup
                value={stability}
                onValueChange={(v) => setStability(v as Stability)}
                className="mt-2 space-y-2"
              >
                {(
                  [
                    { v: "stable", t: "Stable salary every period" },
                    { v: "unstable", t: "Varies month to month" },
                    { v: "freelance", t: "Freelance / project-based" },
                  ] as { v: Stability; t: string }[]
                ).map(({ v, t }) => (
                  <label
                    key={v}
                    className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${
                      stability === v ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={v} />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="dep">Number of dependents</Label>
              <Input
                id="dep"
                inputMode="numeric"
                value={dependents}
                onChange={(e) => setDependents(e.target.value.replace(/[^0-9]/g, ""))}
                className="mt-1"
              />
            </div>
            {depCount > 0 && (
              <div className="space-y-2">
                <Label>Ages (children under 18)</Label>
                {ages.map((a, i) => (
                  <Input
                    key={i}
                    inputMode="numeric"
                    value={a}
                    onChange={(e) => {
                      const next = [...ages];
                      next[i] = e.target.value.replace(/[^0-9]/g, "");
                      setAges(next);
                    }}
                    placeholder={`Dependent ${i + 1} age`}
                  />
                ))}
              </div>
            )}
            <div>
              <Label>Do you support elderly parents?</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setSupportsElderly(v)}
                    className={`border rounded-xl p-3 text-sm ${
                      supportsElderly === v ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {debts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No debts? Skip ahead. Otherwise add each one below.
              </p>
            )}
            {debts.map((d, i) => (
              <div key={i} className="border rounded-xl p-3 space-y-2 bg-card">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Debt {i + 1}</span>
                  <button onClick={() => removeDebt(i)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  placeholder="Debt name (e.g. KCB loan)"
                  value={d.name}
                  onChange={(e) => updateDebt(i, "name", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="Amount (KES)"
                    value={d.amount}
                    onChange={(e) => updateDebt(i, "amount", e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                  <Input
                    inputMode="numeric"
                    placeholder="Interest %"
                    value={d.interest_rate}
                    onChange={(e) =>
                      updateDebt(i, "interest_rate", e.target.value.replace(/[^0-9.]/g, ""))
                    }
                  />
                </div>
                <Input
                  inputMode="numeric"
                  placeholder="Min payment (KES)"
                  value={d.min_payment}
                  onChange={(e) =>
                    updateDebt(i, "min_payment", e.target.value.replace(/[^0-9.]/g, ""))
                  }
                />
              </div>
            ))}
            <Button variant="outline" onClick={addDebt} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add another debt
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {goals.map((g, i) => (
              <div key={i} className="border rounded-xl p-3 space-y-2 bg-card">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Goal {i + 1}</span>
                  {goals.length > 1 && (
                    <button onClick={() => removeGoal(i)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Select value={g.goal_type} onValueChange={(v) => updateGoal(i, "goal_type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  inputMode="numeric"
                  placeholder="Target amount (KES)"
                  value={g.target_amount}
                  onChange={(e) =>
                    updateGoal(i, "target_amount", e.target.value.replace(/[^0-9.]/g, ""))
                  }
                />
                <Input
                  type="month"
                  value={g.target_date}
                  onChange={(e) => updateGoal(i, "target_date", e.target.value)}
                />
                <Select
                  value={g.priority}
                  onValueChange={(v) => updateGoal(i, "priority", v as Priority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p} priority
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {goals.length < 2 ? (
              <Button variant="outline" onClick={addGoal} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add another goal
              </Button>
            ) : (
              <div className="border border-dashed rounded-xl p-4 text-center bg-warning/5">
                <Sparkles className="w-5 h-5 text-warning mx-auto" />
                <p className="text-sm font-medium mt-1">Unlimited goals with Premium</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Free plan supports 2 goals. Upgrade later from the Advisor tab.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            {RISK_QUIZ.map((q, qi) => (
              <div key={qi}>
                <p className="font-medium text-sm mb-2">{qi + 1}. {q.q}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                      className={`w-full text-left border rounded-xl p-3 text-sm ${
                        answers[qi] === oi ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
              Your profile: <span className="font-semibold">{riskTolerance}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex-1 h-11 font-display font-semibold"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={saving}
              className="flex-1 h-11 font-display font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
