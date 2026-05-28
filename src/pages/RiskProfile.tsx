import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Shield, TrendingUp, Sparkles, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

type Level = "Conservative" | "Moderate" | "Aggressive";

const QUESTIONS = [
  {
    q: "If the stock market dropped 20% tomorrow, what would you do?",
    options: [
      { label: "Sell everything immediately", level: "Conservative" as Level },
      { label: "Do nothing, wait for recovery", level: "Moderate" as Level },
      { label: "Buy more at the lower price", level: "Aggressive" as Level },
    ],
  },
  {
    q: "How long until you need the money you're investing?",
    options: [
      { label: "Less than 1 year", level: "Conservative" as Level },
      { label: "3 – 5 years", level: "Moderate" as Level },
      { label: "10+ years", level: "Aggressive" as Level },
    ],
  },
  {
    q: "Which statement best describes you?",
    options: [
      { label: "I prefer safety over returns", level: "Conservative" as Level },
      { label: "I accept moderate risk for moderate returns", level: "Moderate" as Level },
      { label: "I'm comfortable with high risk for high returns", level: "Aggressive" as Level },
    ],
  },
] as const;

const ALLOCATIONS: Record<Level, { label: string; blurb: string; mix: { name: string; pct: number }[]; score: number }> = {
  Conservative: {
    label: "Conservative",
    blurb: "Capital preservation first. Steady, lower-volatility returns.",
    mix: [
      { name: "Bonds / Money Market", pct: 80 },
      { name: "Stocks", pct: 20 },
    ],
    score: 1,
  },
  Moderate: {
    label: "Moderate",
    blurb: "Balanced growth with manageable swings.",
    mix: [
      { name: "Stocks", pct: 50 },
      { name: "Bonds", pct: 40 },
      { name: "Cash", pct: 10 },
    ],
    score: 2,
  },
  Aggressive: {
    label: "Aggressive",
    blurb: "Maximum long-term growth. Expect bigger swings.",
    mix: [
      { name: "Stocks", pct: 80 },
      { name: "Alternatives (REITs, etc.)", pct: 20 },
    ],
    score: 3,
  },
};

export default function RiskProfile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Level | null>(null);
  const [lastAssessedAt, setLastAssessedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_risk_profiles")
      .select("risk_level, assessed_at")
      .eq("user_id", user.id)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDone(data.risk_level as Level);
          setLastAssessedAt(new Date(data.assessed_at));
        }
      });
  }, [user]);

  const total = QUESTIONS.length;
  const canNext = answers[step] !== null;

  const result = useMemo<Level | null>(() => {
    if (answers.some((a) => a === null)) return null;
    const counts: Record<Level, number> = { Conservative: 0, Moderate: 0, Aggressive: 0 };
    answers.forEach((a, i) => {
      const lvl = QUESTIONS[i].options[a!].level;
      counts[lvl]++;
    });
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as Level;
  }, [answers]);

  const submit = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_risk_profiles").insert({
        user_id: user.id,
        risk_level: result,
        risk_score: ALLOCATIONS[result].score,
        answers: answers.map((a, i) => ({
          question: QUESTIONS[i].q,
          choice: QUESTIONS[i].options[a!].label,
          level: QUESTIONS[i].options[a!].level,
        })),
      });
      if (error) throw error;
      setDone(result);
      setLastAssessedAt(new Date());
      toast.success("Risk profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const retake = () => {
    if (lastAssessedAt) {
      const days = (Date.now() - lastAssessedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (days < 30) {
        toast.info(
          `Free plan: re-take available in ${Math.ceil(30 - days)} day(s). Upgrade for unlimited.`
        );
        return;
      }
    }
    setAnswers([null, null, null]);
    setStep(0);
    setDone(null);
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
          <button
            onClick={() => navigate(-1)}
            className="text-warning-foreground/80 text-sm mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="font-display text-2xl font-bold text-warning-foreground">
            Risk Assessment
          </h1>
          <p className="text-warning-foreground/80 text-sm mt-1">
            Required before any investment recommendation.
          </p>
          {!done && (
            <>
              <p className="text-warning-foreground/80 text-xs mt-3">
                Question {step + 1} of {total}
              </p>
              <Progress value={((step + 1) / total) * 100} className="mt-2 h-2 bg-warning-foreground/20" />
            </>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        {done ? (
          <ResultView
            level={done}
            onRetake={retake}
            onContinue={() => navigate("/advisor")}
          />
        ) : (
          <>
            <p className="font-medium mb-3">{QUESTIONS[step].q}</p>
            <div className="space-y-2">
              {QUESTIONS[step].options.map((opt, oi) => (
                <button
                  key={oi}
                  type="button"
                  onClick={() => {
                    const next = [...answers];
                    next[step] = oi;
                    setAnswers(next);
                  }}
                  className={`w-full text-left border rounded-xl p-4 text-sm transition ${
                    answers[step] === oi
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
              )}
              {step < total - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext}
                  className="flex-1 h-11 font-display font-semibold"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={!canNext || saving}
                  className="flex-1 h-11 font-display font-semibold"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "See my result"}
                </Button>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <span>Premium unlocks a 5-question deep assessment and unlimited re-takes.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultView({
  level,
  onRetake,
  onContinue,
}: {
  level: Level;
  onRetake: () => void;
  onContinue: () => void;
}) {
  const a = ALLOCATIONS[level];
  const Icon = level === "Conservative" ? Shield : level === "Aggressive" ? TrendingUp : Sparkles;
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your profile</p>
            <p className="font-display text-xl font-bold">{a.label}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">{a.blurb}</p>

        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recommended allocation
          </p>
          {a.mix.map((m) => (
            <div key={m.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{m.name}</span>
                <span className="font-semibold">{m.pct}%</span>
              </div>
              <Progress value={m.pct} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetake} className="flex-1">
          <RotateCw className="w-4 h-4 mr-1" /> Re-take quiz
        </Button>
        <Button onClick={onContinue} className="flex-1 font-display font-semibold">
          Continue
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Free plan: re-take once every 30 days.
      </p>
    </div>
  );
}
