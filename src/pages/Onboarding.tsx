import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, UserFinancials } from "@/context/AppContext";
import { generateBlueprint } from "@/lib/blueprintEngine";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const steps = ["Income", "Expenses", "Debts", "Protection", "Goals"];

export default function Onboarding() { 
  const navigate = useNavigate();
  const { setFinancials, setBlueprint, setHasCompletedOnboarding } = useApp();
  const [step, setStep] = useState(0);

  const [incomeSources, setIncomeSources] = useState([
    { name: "Salary", amount: "" },
    { name: "Side hustle", amount: "" },
  ]);
  const [expenses, setExpenses] = useState([
    { name: "Rent", amount: "" },
    { name: "Food", amount: "" },
    { name: "Transport", amount: "" },
    { name: "Utilities", amount: "" },
  ]);
  const [debts, setDebts] = useState([{ name: "", amount: "", interestRate: "", monthlyPayment: "" }]);
  const [dependents, setDependents] = useState("0");
  const [hasLifeInsurance, setHasLifeInsurance] = useState(false);
  const [hasHealthInsurance, setHasHealthInsurance] = useState(false);
  const [hasEmergencyFund, setHasEmergencyFund] = useState(false);
  const [emergencyFundAmount, setEmergencyFundAmount] = useState("");
  const [goals, setGoals] = useState([{ name: "", targetAmount: "", deadline: "" }]);

  const handleSubmit = () => {
    const financials: UserFinancials = {
      monthlyIncome: incomeSources.reduce((s, src) => s + (Number(src.amount) || 0), 0),
      expenses: expenses.map(e => ({ name: e.name, amount: Number(e.amount) || 0 })),
      totalExpenses: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
      debts: debts.filter(d => d.name).map(d => ({
        name: d.name,
        amount: Number(d.amount) || 0,
        interestRate: Number(d.interestRate) || 0,
        monthlyPayment: Number(d.monthlyPayment) || 0,
      })),
      totalDebt: debts.reduce((s, d) => s + (Number(d.amount) || 0), 0),
      dependents: Number(dependents) || 0,
      goals: goals.filter(g => g.name).map(g => ({
        name: g.name,
        targetAmount: Number(g.targetAmount) || 0,
        deadline: g.deadline,
      })),
      hasLifeInsurance,
      hasHealthInsurance,
      hasEmergencyFund,
      emergencyFundAmount: Number(emergencyFundAmount) || 0,
    };

    setFinancials(financials);
    const bp = generateBlueprint(financials);
    setBlueprint(bp);
    setHasCompletedOnboarding(true);
    navigate("/dashboard");
  };

  const inputClass = "w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring transition-all";
  const labelClass = "text-sm font-medium text-foreground mb-1.5 block";

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "gradient-gold" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <h1 className="font-display text-2xl font-bold mb-1">{steps[step]}</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {step === 0 && "How much do you earn each month?"}
        {step === 1 && "What are your main monthly expenses?"}
        {step === 2 && "Tell us about any debts you have."}
        {step === 3 && "Let's check your financial safety net."}
        {step === 4 && "What are you saving towards?"}
      </p>

      {/* Step 0: Income */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Income Sources</label>
            <div className="space-y-3">
              {incomeSources.map((src, i) => (
                <div key={i} className="bg-card rounded-xl p-4 shadow-card space-y-2">
                  <input
                    value={src.name}
                    onChange={e => {
                      const next = [...incomeSources];
                      next[i].name = e.target.value;
                      setIncomeSources(next);
                    }}
                    placeholder="e.g. Salary, Freelance, Rental income"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={src.amount}
                    onChange={e => {
                      const next = [...incomeSources];
                      next[i].amount = e.target.value;
                      setIncomeSources(next);
                    }}
                    placeholder="Amount in KES"
                    className={inputClass}
                  />
                  {incomeSources.length > 1 && (
                    <button
                      onClick={() => setIncomeSources(incomeSources.filter((_, idx) => idx !== i))}
                      className="text-xs text-destructive font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setIncomeSources([...incomeSources, { name: "", amount: "" }])}
              className="text-sm text-primary font-medium mt-2"
            >
              + Add income source
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Total: KES {incomeSources.reduce((s, src) => s + (Number(src.amount) || 0), 0).toLocaleString()}/month
            </p>
          </div>
          <div>
            <label className={labelClass}>Number of Dependents</label>
            <input
              type="number"
              value={dependents}
              onChange={e => setDependents(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Step 1: Expenses */}
      {step === 1 && (
        <div className="space-y-3">
          {expenses.map((exp, i) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-card space-y-2">
              <input
                value={exp.name}
                onChange={e => {
                  const next = [...expenses];
                  next[i].name = e.target.value;
                  setExpenses(next);
                }}
                placeholder="e.g. Rent, Food, Transport, Utilities"
                className={inputClass}
              />
              <input
                type="number"
                value={exp.amount}
                onChange={e => {
                  const next = [...expenses];
                  next[i].amount = e.target.value;
                  setExpenses(next);
                }}
                placeholder="Amount in KES"
                className={inputClass}
              />
              {expenses.length > 1 && (
                <button
                  onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))}
                  className="text-xs text-destructive font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setExpenses([...expenses, { name: "", amount: "" }])}
            className="text-sm text-primary font-medium"
          >
            + Add expense
          </button>
        </div>
      )}

      {/* Step 2: Debts */}
      {step === 2 && (
        <div className="space-y-4">
          {debts.map((debt, i) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-card space-y-3">
              <input
                value={debt.name}
                onChange={e => {
                  const next = [...debts];
                  next[i].name = e.target.value;
                  setDebts(next);
                }}
                placeholder="e.g. Personal loan"
                className={inputClass}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={debt.amount}
                  onChange={e => {
                    const next = [...debts];
                    next[i].amount = e.target.value;
                    setDebts(next);
                  }}
                  placeholder="Total (KES)"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={debt.interestRate}
                  onChange={e => {
                    const next = [...debts];
                    next[i].interestRate = e.target.value;
                    setDebts(next);
                  }}
                  placeholder="Rate %"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={debt.monthlyPayment}
                  onChange={e => {
                    const next = [...debts];
                    next[i].monthlyPayment = e.target.value;
                    setDebts(next);
                  }}
                  placeholder="Monthly"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => setDebts([...debts, { name: "", amount: "", interestRate: "", monthlyPayment: "" }])}
            className="text-sm text-primary font-medium"
          >
            + Add debt
          </button>
          <p className="text-xs text-muted-foreground">No debts? Just skip to the next step.</p>
        </div>
      )}

      {/* Step 3: Protection */}
      {step === 3 && (
        <div className="space-y-4">
          {[
            { label: "Do you have life insurance?", value: hasLifeInsurance, set: setHasLifeInsurance },
            { label: "Do you have health insurance / SHA?", value: hasHealthInsurance, set: setHasHealthInsurance },
            { label: "Do you have an emergency fund?", value: hasEmergencyFund, set: setHasEmergencyFund },
          ].map(({ label, value, set }) => (
            <div key={label} className="bg-card rounded-xl p-4 shadow-card">
              <p className="text-sm font-medium mb-3">{label}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => set(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => set(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    !value
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          ))}
          {hasEmergencyFund && (
            <div>
              <label className={labelClass}>Emergency fund amount (KES)</label>
              <input
                type="number"
                value={emergencyFundAmount}
                onChange={e => setEmergencyFundAmount(e.target.value)}
                placeholder="e.g. 150,000"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 4: Goals */}
      {step === 4 && (
        <div className="space-y-4">
          {goals.map((goal, i) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-card space-y-3">
              <input
                value={goal.name}
                onChange={e => {
                  const next = [...goals];
                  next[i].name = e.target.value;
                  setGoals(next);
                }}
                placeholder="e.g. Emergency fund, School fees"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={goal.targetAmount}
                  onChange={e => {
                    const next = [...goals];
                    next[i].targetAmount = e.target.value;
                    setGoals(next);
                  }}
                  placeholder="Target (KES)"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={goal.deadline}
                  onChange={e => {
                    const next = [...goals];
                    next[i].deadline = e.target.value;
                    setGoals(next);
                  }}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => setGoals([...goals, { name: "", targetAmount: "", deadline: "" }])}
            className="text-sm text-primary font-medium"
          >
            + Add goal
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else handleSubmit();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-gold text-warning-foreground font-semibold text-sm shadow-elevated transition-transform active:scale-[0.98]"
        >
          {step === steps.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4" /> Generate My Blueprint
            </>
          ) : (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
