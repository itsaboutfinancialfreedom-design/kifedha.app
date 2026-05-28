import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Target, CalendarDays, Zap, ChevronDown, Sparkles } from "lucide-react";
import { differenceInMonths, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export default function Goals() {
  const { financials, blueprint, automation, autopilots, setAutopilots } = useApp();
  const [showWhy, setShowWhy] = useState<string | null>(null);

  if (!financials || !blueprint) return null;

  const monthlySavings = blueprint.allocation.savings.amount;
  const activeAutopilots = autopilots.filter(a => a.enabled).length;
  // Split savings evenly across enabled autopilots (simple, transparent rule)
  const perGoalAuto = activeAutopilots > 0 ? Math.floor(monthlySavings / activeAutopilots) : 0;

  function getAutopilot(goalName: string) {
    return autopilots.find(a => a.goalName === goalName);
  }

  function toggleAutopilot(goalName: string, enabled: boolean) {
    if (enabled && !automation.autopilotGoals) {
      toast.error("Enable Goal Autopilot in Settings first.");
      return;
    }
    const existing = autopilots.find(a => a.goalName === goalName);
    let next;
    if (existing) {
      next = autopilots.map(a =>
        a.goalName === goalName ? { ...a, enabled, lastRunISO: new Date().toISOString() } : a
      );
    } else {
      next = [
        ...autopilots,
        {
          goalName,
          enabled,
          monthlyContribution: perGoalAuto || Math.floor(monthlySavings / Math.max(1, financials!.goals.length)),
          simulatedBalance: 0,
          lastRunISO: new Date().toISOString(),
        },
      ];
    }
    setAutopilots(next);
    toast.success(enabled ? `Autopilot ON for ${goalName}` : `Autopilot OFF for ${goalName}`);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="font-display text-2xl font-bold mb-1">Your Goals</h1>
        <p className="text-sm text-muted-foreground mb-5">
          With KES {monthlySavings.toLocaleString()}/mo in savings, here's your progress.
        </p>

        {/* Autopilot status banner */}
        {automation.autopilotGoals && activeAutopilots > 0 && (
          <div className="mb-5 rounded-2xl p-4 bg-card border border-primary/30 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                <Zap className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-sm">Self-driving money is ON</p>
                <p className="text-xs text-muted-foreground">
                  Auto-allocating ~KES {perGoalAuto.toLocaleString()}/mo to each of {activeAutopilots} goal{activeAutopilots > 1 ? "s" : ""}.
                </p>
              </div>
            </div>
          </div>
        )}

        {financials.goals.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No goals set yet. Update your blueprint to add goals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {financials.goals.map((goal, i) => {
              const targetAmount = Number(goal.targetAmount) || 0;
              const monthsLeft = goal.deadline
                ? Math.max(1, differenceInMonths(parseISO(goal.deadline), new Date()))
                : 12;
              const monthlyNeeded = Math.ceil(targetAmount / monthsLeft) || 0;
              const ap = getAutopilot(goal.name);
              const autoBal = ap?.enabled ? ap.simulatedBalance : 0;
              const progressPct = targetAmount > 0
                ? (Math.min(100, Math.round((autoBal / targetAmount) * 100)) ||
                   Math.min(100, Math.round((monthlySavings / Math.max(1, monthlyNeeded)) * 100)))
                : 0;

              return (
                <div key={i} className="bg-card rounded-2xl p-5 shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                      <Target className="w-5 h-5 text-secondary-foreground" />
                    </div>
                        KES {targetAmount.toLocaleString()} target
                      <h3 className="font-display font-semibold text-sm">{goal.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        KES {goal.targetAmount.toLocaleString()} target
                      </p>
                    </div>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full gradient-green rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      <span>{monthsLeft} months left</span>
                    </div>
                    <span>KES {monthlyNeeded.toLocaleString()}/mo needed</span>
                  </div>

                  {ap?.enabled && (
                    <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                      <p className="text-xs font-medium text-foreground">
                        ⚡ Autopilot saved KES {Math.round(ap.simulatedBalance).toLocaleString()} so far
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Contributing KES {ap.monthlyContribution.toLocaleString()}/mo automatically
                      </p>
                    </div>
                  )}

                  {monthlySavings < monthlyNeeded && !ap?.enabled && (
                    <div className="mt-3 p-2.5 bg-warning/10 rounded-lg">
                      <p className="text-xs text-foreground">
                        💡 You need KES {(monthlyNeeded - monthlySavings).toLocaleString()} more/mo. Extend timeline or boost savings.
                      </p>
                    </div>
                  )}

                  {/* Autopilot toggle row */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">Goal Autopilot</p>
                      <button
                        onClick={() => setShowWhy(showWhy === goal.name ? null : goal.name)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Sparkles className="w-3 h-3" /> Why? <ChevronDown className={`w-3 h-3 transition-transform ${showWhy === goal.name ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <Switch
                      checked={!!ap?.enabled}
                      onCheckedChange={(v) => toggleAutopilot(goal.name, v)}
                    />
                  </div>

                  {showWhy === goal.name && (
                    <div className="mt-2 p-2.5 bg-muted/60 rounded-lg border border-border">
                      <p className="text-[11px] text-foreground/80 leading-relaxed">
                        We split your KES {monthlySavings.toLocaleString()}/mo savings allocation evenly across goals with autopilot ON. With this goal active, that's roughly KES {perGoalAuto.toLocaleString()}/mo. The simulated balance grows daily so you can see progress without needing to move money manually.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
