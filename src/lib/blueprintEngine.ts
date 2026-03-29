import { UserFinancials, FinancialBlueprint } from "@/context/AppContext";

export function generateBlueprint(f: UserFinancials): FinancialBlueprint {
  const income = f.monthlyIncome;
  const totalExpenses = f.totalExpenses;
  const totalDebtPayments = f.debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const remaining = income - totalExpenses - totalDebtPayments;

  const expenseRatio = totalExpenses / income;
  const debtRatio = totalDebtPayments / income;

  // Smart allocation
  let needsPct = Math.min(Math.round(expenseRatio * 100), 55);
  let debtPct = Math.min(Math.round(debtRatio * 100), 25);
  let protectionPct = f.hasLifeInsurance && f.hasHealthInsurance ? 5 : 10;
  let savingsPct = Math.max(20 - debtPct, 10);
  let investPct = Math.max(100 - needsPct - debtPct - protectionPct - savingsPct, 5);

  // Normalize
  const total = needsPct + debtPct + protectionPct + savingsPct + investPct;
  if (total !== 100) {
    const diff = 100 - total;
    investPct += diff;
  }

  const allocation = {
    needs: { percent: needsPct, amount: Math.round(income * needsPct / 100) },
    savings: { percent: savingsPct, amount: Math.round(income * savingsPct / 100) },
    investments: { percent: investPct, amount: Math.round(income * investPct / 100) },
    protection: { percent: protectionPct, amount: Math.round(income * protectionPct / 100) },
    debtRepayment: { percent: debtPct, amount: Math.round(income * debtPct / 100) },
  };

  // Health score (0-100)
  let score = 50;
  if (expenseRatio < 0.5) score += 15;
  else if (expenseRatio < 0.7) score += 5;
  else score -= 10;
  if (f.hasEmergencyFund) score += 10;
  if (f.emergencyFundAmount >= income * 3) score += 10;
  if (f.hasLifeInsurance) score += 5;
  if (f.hasHealthInsurance) score += 5;
  if (debtRatio < 0.1) score += 10;
  else if (debtRatio > 0.3) score -= 15;
  if (f.goals.length > 0) score += 5;
  score = Math.max(0, Math.min(100, score));

  const risks: string[] = [];
  const opportunities: string[] = [];
  const actionPlan: string[] = [];
  const insuranceRecommendations: string[] = [];

  if (!f.hasLifeInsurance) {
    risks.push("No life insurance — your dependents are unprotected");
    insuranceRecommendations.push(`Get life cover of at least KES ${(income * 12 * 5).toLocaleString()} (5x annual income)`);
  }
  if (!f.hasHealthInsurance) {
    risks.push("No health cover — one hospital visit could wipe your savings");
    insuranceRecommendations.push("Start with NHIF or affordable private health cover");
  }
  if (!f.hasEmergencyFund || f.emergencyFundAmount < income * 3) {
    risks.push("Emergency fund below 3 months of income");
    actionPlan.push(`Build emergency fund to KES ${(income * 3).toLocaleString()} (3 months income)`);
  }
  if (debtRatio > 0.3) {
    risks.push("Debt payments consume over 30% of your income");
    actionPlan.push("Focus on paying off highest-interest debt first (avalanche method)");
  }

  if (remaining > income * 0.1) {
    opportunities.push(`You have KES ${remaining.toLocaleString()} available monthly for wealth building`);
  }
  opportunities.push("Start a money market fund for better savings returns than a bank account");
  opportunities.push("Consider a SACCO for group savings and affordable credit");

  if (actionPlan.length === 0) {
    actionPlan.push("Keep up the great work! Consider increasing your investment allocation");
  }
  actionPlan.push("Review your financial plan monthly and adjust as your income grows");

  // Financial risk score (0-100, higher = more risky)
  let riskScore = 30;
  if (!f.hasLifeInsurance) riskScore += 20;
  if (!f.hasHealthInsurance) riskScore += 15;
  if (!f.hasEmergencyFund) riskScore += 15;
  if (debtRatio > 0.3) riskScore += 20;
  if (f.dependents > 0 && !f.hasLifeInsurance) riskScore += 10;
  riskScore = Math.min(100, riskScore);

  if (!f.hasLifeInsurance || !f.hasHealthInsurance) {
    insuranceRecommendations.push("Consider income protection insurance to cover your earnings if you can't work");
  }

  return {
    allocation,
    healthScore: score,
    risks,
    opportunities,
    actionPlan,
    riskScore,
    insuranceRecommendations,
  };
}
