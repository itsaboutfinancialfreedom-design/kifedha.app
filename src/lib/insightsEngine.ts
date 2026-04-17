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

  return insights;
}
