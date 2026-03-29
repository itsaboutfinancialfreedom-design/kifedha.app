import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { Target, CalendarDays } from "lucide-react";
import { differenceInMonths, parseISO } from "date-fns";

export default function Goals() {
  const { financials, blueprint } = useApp();

  if (!financials || !blueprint) return null;

  const monthlySavings = blueprint.allocation.savings.amount;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="font-display text-2xl font-bold mb-1">Your Goals</h1>
        <p className="text-sm text-muted-foreground mb-6">
          With KES {monthlySavings.toLocaleString()}/mo in savings, here's your progress.
        </p>

        {financials.goals.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No goals set yet. Update your blueprint to add goals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {financials.goals.map((goal, i) => {
              const monthsLeft = goal.deadline
                ? Math.max(1, differenceInMonths(parseISO(goal.deadline), new Date()))
                : 12;
              const monthlyNeeded = Math.ceil(goal.targetAmount / monthsLeft);
              const progressPct = Math.min(100, Math.round((monthlySavings / monthlyNeeded) * 100));

              return (
                <div key={i} className="bg-card rounded-2xl p-5 shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                      <Target className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
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

                  {monthlySavings < monthlyNeeded && (
                    <div className="mt-3 p-2.5 bg-warning/10 rounded-lg">
                      <p className="text-xs text-foreground">
                        💡 You need KES {(monthlyNeeded - monthlySavings).toLocaleString()} more per month. Consider extending your timeline or increasing savings.
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
