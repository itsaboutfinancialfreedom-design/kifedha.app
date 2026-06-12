import { UserFinancials, FinancialBlueprint } from "@/context/AppContext";

export type InsightSeverity = "info" | "warning" | "danger" | "success";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  reason: string;          // transparency: why we're showing this
  category: "spending" | "subscription" | "balance" | "automation" | "savings";
  actionLabel?: string;
}

const SUBSCRIPTION_KEYWORDS = [
  "netflix", "spotify", "showmax", "dstv", "gotv", "subscription",
  "youtube", "apple", "icloud", "prime", "hulu", "gym", "membership",
  "azam", "zuku", "safaricom home", "internet", "vpn",
];

function isLikelySubscription(name: string): boolean {
  const n = name.toLowerCase();
  return SUBSCRIPTION_KEYWORDS.some(k => n.includes(k));
}

export function generateInsights(
  f: UserFinancials,
  b: FinancialBlueprint,
): Insight[] {
  const insights: Insight[] = [];
  const income = f.monthlyIncome;
  const totalDebtPayments = f.debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const monthlyOutflow = f.totalExpenses + totalDebtPayments;
  const surplus = income - monthlyOutflow;

  // ---- 1. Predictive low-balance alert ----
  if (surplus < income * 0.05) {
    insights.push({
      id: "low-balance",
      severity: "danger",
      title: "Tight cash flow ahead",
      body: `After expenses & debt, only KES ${Math.max(0, surplus).toLocaleString()} is left each month. A surprise bill could overdraw you.`,
      reason: `Income (KES ${income.toLocaleString()}) − expenses (KES ${f.totalExpenses.toLocaleString()}) − debt payments (KES ${totalDebtPayments.toLocaleString()}) = KES ${surplus.toLocaleString()}, which is under 5% of income.`,
      category: "balance",
      actionLabel: "Review budget",
    });
  } else if (surplus < income * 0.15) {
    insights.push({
      id: "low-balance-warn",
      severity: "warning",
      title: "Buffer is thin",
      body: `Your monthly buffer is KES ${surplus.toLocaleString()}. Aim for 15–20% breathing room.`,
      reason: `Surplus of KES ${surplus.toLocaleString()} is below the 15% safety threshold of your KES ${income.toLocaleString()} income.`,
      category: "balance",
    });
  }

  // ---- 2. Subscription detection ----
  const subs = f.expenses.filter(e => isLikelySubscription(e.name));
  if (subs.length > 0) {
    const subTotal = subs.reduce((s, e) => s + e.amount, 0);
    const pct = Math.round((subTotal / income) * 100);
    insights.push({
      id: "subs-detected",
      severity: pct > 8 ? "warning" : "info",
      title: `${subs.length} subscription${subs.length > 1 ? "s" : ""} detected`,
      body: `You're spending KES ${subTotal.toLocaleString()}/mo (${pct}% of income) on: ${subs.map(s => s.name).join(", ")}.`,
      reason: `Matched these expense names against common subscription keywords (Netflix, Spotify, DStv, gym, etc.).`,
      category: "subscription",
      actionLabel: "Review & cancel unused",
    });

    // Duplicate detection — entertainment overlap
    const entertainment = subs.filter(s =>
      ["netflix", "showmax", "dstv", "youtube", "prime", "hulu", "gotv"].some(k => s.name.toLowerCase().includes(k))
    );
    if (entertainment.length >= 2) {
      insights.push({
        id: "subs-duplicate",
        severity: "warning",
        title: "Overlapping entertainment subs",
        body: `You have ${entertainment.length} streaming/TV services. Most people only actively use 1–2.`,
        reason: `Detected ${entertainment.length} services in the entertainment category: ${entertainment.map(e => e.name).join(", ")}.`,
        category: "subscription",
        actionLabel: "Pick one to cancel",
      });
    }
  }

  // ---- 3. Spending category insights ----
  if (f.expenses.length > 0) {
    const top = [...f.expenses].sort((a, b) => b.amount - a.amount)[0];
    const topPct = Math.round((top.amount / f.totalExpenses) * 100);
    if (topPct > 40) {
      insights.push({
        id: "top-category",
        severity: "info",
        title: `${top.name} dominates your budget`,
        body: `${top.name} alone is ${topPct}% of your expenses (KES ${top.amount.toLocaleString()}). Cutting it 10% saves KES ${Math.round(top.amount * 0.1).toLocaleString()}/mo.`,
        reason: `${top.name} = ${topPct}% of your KES ${f.totalExpenses.toLocaleString()} total expenses. Anything over 40% is concentration risk.`,
        category: "spending",
      });
    }

    // ---- 3b. Spending anomaly: actual "Needs" outflow vs blueprint plan ----
    const plannedNeeds = b.allocation.needs.amount;
    const actualNeeds = f.totalExpenses;
    if (plannedNeeds > 0 && actualNeeds > plannedNeeds * 1.2) {
      const overPct = Math.round(((actualNeeds - plannedNeeds) / plannedNeeds) * 100);
      const overKES = actualNeeds - plannedNeeds;
      insights.push({
        id: "spending-anomaly",
        severity: overPct > 40 ? "danger" : "warning",
        title: `You're spending ${overPct}% above plan`,
        body: `Your expenses (KES ${actualNeeds.toLocaleString()}) are KES ${overKES.toLocaleString()} over the recommended Needs budget. This is squeezing savings & investments.`,
        reason: `Blueprint allocates KES ${plannedNeeds.toLocaleString()} to Needs (50% rule). Actual spending exceeds it by more than 20%, which signals lifestyle creep.`,
        category: "spending",
        actionLabel: "See what to cut",
      });
    }
  }

  // ---- 4. Idle cash opportunity (self-driving prompt) ----
  if (f.hasEmergencyFund && f.emergencyFundAmount > income * 6) {
    const idle = f.emergencyFundAmount - income * 6;
    insights.push({
      id: "idle-cash",
      severity: "success",
      title: "Idle cash earning nothing",
      body: `KES ${idle.toLocaleString()} above your 6-month emergency buffer is sitting idle. A money-market fund could earn ~10% / yr (≈ KES ${Math.round(idle * 0.1).toLocaleString()}).`,
      reason: `Emergency fund of KES ${f.emergencyFundAmount.toLocaleString()} exceeds the recommended 6 months of income (KES ${(income * 6).toLocaleString()}).`,
      category: "savings",
      actionLabel: "Enable auto-sweep",
    });
  }

  // ---- 5. Round-ups opportunity ----
  if (surplus > 0) {
    const estRoundUps = Math.round(f.expenses.length * 30 * 25); // ~KES 25 per txn estimate
    if (estRoundUps > 500) {
      insights.push({
        id: "round-ups",
        severity: "info",
        title: "Round-ups could save you ~KES " + estRoundUps.toLocaleString() + "/mo",
        body: `Rounding each transaction up to the nearest 100 and saving the difference adds up fast.`,
        reason: `Estimated from your ${f.expenses.length} expense categories × ~30 transactions/mo × ~KES 25 average round-up.`,
        category: "automation",
        actionLabel: "Turn on round-ups",
      });
    }
  }

  // ---- NEW: Insurance-as-savings opportunity ----

  // Trigger when: surplus > 10% income AND user has a
  // long-term goal (5+ years) AND no life insurance
  const hasLongTermGoal = f.goals.some(g => {
    if (!g.target_date) return false;
    const yearsToGoal = (new Date(g.target_date).getTime()
      - Date.now()) / (1000 * 60 * 60 * 24 * 365);
    return yearsToGoal >= 5;
  });

  const hasRetirementGoal = f.goals.some(g =>
    g.goal_type?.toLowerCase().includes("retirement")
  );

  const hasSchoolFeesGoal = f.goals.some(g =>
    g.goal_type?.toLowerCase().includes("school") ||
    g.goal_type?.toLowerCase().includes("university")
  );

  if (surplus > income * 0.1 && !f.hasLifeInsurance
    && (hasLongTermGoal || hasRetirementGoal
      || hasSchoolFeesGoal)) {
    insights.push({
      id: "insurance-savings-opportunity",
      severity: "info",
      title: "Insurance could fund your long-term goals",
      body: `You have KES ${Math.round(surplus).toLocaleString()} surplus monthly and a ${
        hasSchoolFeesGoal ? "school fees" :
        hasRetirementGoal ? "retirement" :
        "long-term"
      } goal. An endowment or education policy turns monthly premiums into a guaranteed lump sum — with built-in life cover. Ask your advisor.`,
      reason: `Monthly surplus of KES ${Math.round(surplus).toLocaleString()} exceeds 10% of income. A long-term goal exists. No life insurance is active. Insurance-linked savings products may be more disciplined than a standalone savings account for this timeline.`,
      category: "savings",
      actionLabel: "Ask the AI advisor",
    });
  }

  // School fees education policy — specific trigger
  if (hasSchoolFeesGoal && f.dependents > 0
    && surplus > income * 0.05) {
    insights.push({
      id: "education-policy-opportunity",
      severity: "info",
      title: "Protect your child's education",
      body: `With ${f.dependents} dependent${f.dependents > 1 ? "s" : ""} and a school fees goal, an education policy guarantees the payout even if something happens to you — premiums are waived on death. Your KES ${Math.round(surplus).toLocaleString()} monthly surplus could start a policy now.`,
      reason: `School fees goal detected. ${f.dependents} dependant(s). Monthly surplus of KES ${Math.round(surplus).toLocaleString()} is sufficient for a starter education policy premium.`,
      category: "savings",
      actionLabel: "Learn more",
    });
  }

  // Retirement — insurance annuity trigger
  if ((hasRetirementGoal || f.goals.length === 0)
    && income > 40000
    && surplus > income * 0.08) {
    insights.push({
      id: "retirement-annuity-opportunity",
      severity: "info",
      title: "Structured retirement savings available",
      body: `NSSF alone won't fund your retirement. A retirement annuity policy or whole-of-life plan, started today at your income level, could provide meaningful pension income. Your KES ${Math.round(surplus).toLocaleString()} surplus creates the room.`,
      reason: `Income above KES 40,000. Surplus above 8% of income. Retirement or no goals detected. NSSF contributions at KES 2,160/mo are insufficient for most income levels.`,
      category: "savings",
      actionLabel: "Plan my retirement",
    });
  }

  // --- existing return line (keep unchanged) ---
  return insights;
}
