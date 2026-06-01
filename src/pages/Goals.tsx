import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInMonths, parseISO, format } from "date-fns";
import { Target, CalendarDays, Plus, Trash2, Sparkles, Lock, Trophy, Share2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

const GOAL_TYPES = [
  "Emergency fund",
  "School fees",
  "Retirement",
  "House deposit",
  "Business capital",
  "Vacation",
];

const FREE_GOAL_LIMIT = 2;

interface GoalRow {
  id: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: string | null;
}

interface Draft {
  goal_type: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
}

const emptyDraft: Draft = {
  goal_type: GOAL_TYPES[0],
  target_amount: "",
  current_amount: "",
  target_date: "",
};

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useApp();

  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [contribGoal, setContribGoal] = useState<GoalRow | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribSaving, setContribSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [{ data: g }, { data: a }] = await Promise.all([
        supabase.from("user_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("user_allocations").select("savings_amount").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setGoals((g ?? []) as GoalRow[]);
      setMonthlySavings(Number(a?.savings_amount ?? 0));
      setLoading(false);
    })();
  }, [user]);

  const perGoalAllocation = useMemo(
    () => (goals.length > 0 ? Math.floor(monthlySavings / goals.length) : 0),
    [goals.length, monthlySavings]
  );

  const atFreeLimit = !isPremium && goals.length >= FREE_GOAL_LIMIT;

  function openCreate() {
    if (atFreeLimit) {
      toast.error(`Free plan allows ${FREE_GOAL_LIMIT} goals. Upgrade for unlimited.`);
      return;
    }
    setDraft(emptyDraft);
    setOpen(true);
  }

  async function saveGoal() {
    if (!user) { toast.error("Please sign in"); return; }
    const target = Number(draft.target_amount);
    const current = Number(draft.current_amount || "0");
    if (!draft.goal_type || !(target > 0)) {
      toast.error("Pick a goal type and target amount");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("user_goals")
      .insert({
        user_id: user.id,
        goal_type: draft.goal_type,
        target_amount: target,
        current_amount: current,
        target_date: draft.target_date || null,
        priority: "Medium",
        is_premium_feature: false,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setGoals((p) => [...p, data as GoalRow]);
    setOpen(false);
    toast.success("Goal added");
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from("user_goals").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setGoals((p) => p.filter((g) => g.id !== id));
  }

  async function fetchGoals() {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setGoals((data ?? []) as GoalRow[]);
  }

  function openContrib(goal: GoalRow) {
    setContribGoal(goal);
    setContribAmount("");
  }

  function shareGoal(goal: GoalRow) {
    const target = Number(goal.target_amount) || 0;
    const current = Number(goal.current_amount) || 0;
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;

    let proverb = "Haba na haba hujaza kibaba — little by little fills the measure.";
    if (goal.goal_type.toLowerCase().includes("house") || goal.goal_type.toLowerCase().includes("land")) {
      proverb = "Ardhi ni mali — land is wealth.";
    } else if (goal.goal_type.toLowerCase().includes("school") || goal.goal_type.toLowerCase().includes("education")) {
      proverb = "Elimu ni ufunguo wa maisha — education is the key to life.";
    } else if (goal.goal_type.toLowerCase().includes("business")) {
      proverb = "Biashara ni ujanja — business is cleverness.";
    }

    const msg = [
      `🎯 I'm ${pct}% towards my ${goal.goal_type} goal on Kifedha!`,
      `Saved KES ${current.toLocaleString()} of KES ${target.toLocaleString()}`,
      "",
      pct >= 100 ? `🎉 Goal achieved! ${proverb}` : proverb,
      "",
      "Track your goals: https://www.kifedha.app",
    ].join("\n");

    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  }

  async function saveContrib() {
    if (!contribGoal) return;
    const amount = Number(contribAmount);
    if (!(amount > 0)) {
      toast.error("Enter a valid amount");
      return;
    }
    setContribSaving(true);
    const { error } = await supabase
      .from("user_goals")
      .update({ current_amount: contribGoal.current_amount + amount })
      .eq("id", contribGoal.id);
    setContribSaving(false);
    if (error) { toast.error(error.message); return; }
    await fetchGoals();
    setContribGoal(null);
    setContribAmount("");
    toast.success(`KES ${amount.toLocaleString()} added to ${contribGoal.goal_type}!`);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base flex-1">Your Goals</h1>
          <Button onClick={openCreate} size="sm">
            {atFreeLimit ? <Lock className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            New Goal
          </Button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a goal</DialogTitle>
              <DialogDescription>What are you saving for?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Goal type</Label>
                <Select value={draft.goal_type} onValueChange={(v) => setDraft({ ...draft, goal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target amount (KES)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="e.g. 500000"
                  value={draft.target_amount}
                  onChange={(e) => setDraft({ ...draft, target_amount: e.target.value.replace(/[^0-9]/g, "") })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Already saved (KES, optional)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={draft.current_amount}
                  onChange={(e) => setDraft({ ...draft, current_amount: e.target.value.replace(/[^0-9]/g, "") })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Target date</Label>
                <Input
                  type="date"
                  value={draft.target_date}
                  onChange={(e) => setDraft({ ...draft, target_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveGoal} disabled={saving}>{saving ? "Saving…" : "Save goal"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {atFreeLimit && (
          <Card className="mb-5 border-premium/40 bg-premium/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-premium shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Free plan limit reached</p>
                <p className="text-xs text-muted-foreground">Upgrade to track unlimited goals.</p>
              </div>
              <Button size="sm" onClick={() => navigate("/advisor/upgrade")}>Upgrade</Button>
            </CardContent>
          </Card>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm mb-4">No goals yet. Create your first one.</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add goal</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const target = Number(g.target_amount) || 0;
              const current = Number(g.current_amount) || 0;
              const monthsLeft = g.target_date
                ? Math.max(1, differenceInMonths(parseISO(g.target_date), new Date()))
                : 12;
              const remaining = Math.max(0, target - current);
              const monthlyNeeded = Math.ceil(remaining / monthsLeft);
              const progressPct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              const allocation = perGoalAllocation;
              const shortfall = monthlyNeeded - allocation;

              const barColor =
                progressPct >= 80 ? "bg-emerald-500" :
                progressPct >= 40 ? "bg-amber-500" : "bg-primary";

              return (
                <Card key={g.id}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                        <Target className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{g.goal_type}</CardTitle>
                        <CardDescription className="text-xs">
                          KES {current.toLocaleString()} / {target.toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openContrib(g)}>
                        Add contribution
                      </Button>
                      {current > 0 && (
                        <Button size="sm" variant="outline" onClick={() => shareGoal(g)} aria-label="Share goal">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      )}
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full w-full flex-1 ${barColor} transition-all`}
                        style={{ transform: `translateX(-${100 - progressPct}%)` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">
                        {progressPct}% · KES {current.toLocaleString()} saved of KES {target.toLocaleString()} target
                      </span>
                    </div>

                    {current >= target && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                        <Trophy className="w-4 h-4" />
                        Goal reached! 🎉
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {g.target_date ? format(parseISO(g.target_date), "MMM yyyy") : "No date"} · {monthsLeft} mo
                      </span>
                      <span>KES {monthlyNeeded.toLocaleString()}/mo needed</span>
                    </div>

                    {monthlySavings > 0 && (
                      <div className={`rounded-lg p-3 text-xs ${shortfall > 0 ? "bg-warning/10" : "bg-success/10"}`}>
                        {shortfall > 0 ? (
                          <>💡 Your blueprint allocates KES {allocation.toLocaleString()}/mo per goal. Boost by KES {shortfall.toLocaleString()} or extend the timeline.</>
                        ) : (
                          <>✅ Your KES {allocation.toLocaleString()}/mo allocation covers this goal.</>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!contribGoal} onOpenChange={(open) => { if (!open) { setContribGoal(null); setContribAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to {contribGoal?.goal_type}</DialogTitle>
            <DialogDescription>Record a contribution toward this goal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (KES)</Label>
              <Input
                inputMode="numeric"
                placeholder="Amount in KES"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setContribGoal(null); setContribAmount(""); }}>Cancel</Button>
            <Button onClick={saveContrib} disabled={contribSaving}>{contribSaving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
