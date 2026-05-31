import { useMemo, useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  LineChart,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Search,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useTransactions } from "@/context/TransactionsContext";

// ---------- Data ----------
type PillarKey =
  | "budgeting"
  | "saving"
  | "debt"
  | "investing"
  | "credit"
  | "insurance";

interface Pillar {
  key: PillarKey;
  title: string;
  icon: any;
  nutshell: string;
  inKifedha: string;
  example: string;
  extra?: React.ReactNode;
}

export const PILLARS: Pillar[] = [
  {
    key: "budgeting",
    title: "Budgeting",
    icon: Wallet,
    nutshell:
      "Telling every shilling where to go before the month spends it for you.",
    inKifedha:
      "Kifedha auto-categorizes every M-Pesa entry and shows your 'Safe to spend today' so you stay on plan without spreadsheets.",
    example:
      "Earn KSh 60,000. Allocate 50% needs (rent, food), 30% wants, 20% save/invest. Kifedha alerts you when 'wants' hit 25%.",
  },
  {
    key: "saving",
    title: "Saving",
    icon: PiggyBank,
    nutshell:
      "Setting aside money today so future-you has options tomorrow.",
    inKifedha:
      "Goals + round-ups quietly stash spare change. Auto-sweep moves idle cash to your emergency pot.",
    example:
      "Round-ups on a KSh 270 matatu fare save KSh 30. Over a month that's ~KSh 900 with zero effort.",
  },
  {
    key: "debt",
    title: "Debt",
    icon: TrendingDown,
    nutshell:
      "Borrowed money you must repay — usually with interest. Good debt builds, bad debt drains.",
    inKifedha:
      "Debt tracker ranks loans by interest rate (avalanche) or smallest balance (snowball) and shows months-to-freedom.",
    example:
      "KSh 50,000 mobile loan at 7%/month vs KSh 200,000 SACCO at 1%/month → clear the mobile loan first.",
  },
  {
    key: "investing",
    title: "Investing",
    icon: LineChart,
    nutshell:
      "Putting money into assets (MMFs, stocks, T-bills) so it grows faster than inflation.",
    inKifedha:
      "Wealth view models compounding on your surplus and suggests Kenyan MMFs and T-bills based on your risk score.",
    example:
      "KSh 5,000/month in a 10% MMF for 10 years ≈ KSh 1.03M. Same money under the mattress: KSh 600,000.",
  },
  {
    key: "credit",
    title: "Credit",
    icon: CreditCard,
    nutshell:
      "Your reputation for repaying borrowed money. Better credit = cheaper loans.",
    inKifedha:
      "We flag high credit-card utilization and missed-payment risk before they hit your CRB report.",
    example:
      "Card limit KSh 100,000, balance KSh 80,000 = 80% utilization → score drops. Keep it under 30% (KSh 30,000).",
  },
  {
    key: "insurance",
    title: "Insurance (Wealth Protection)",
    icon: ShieldCheck,
    nutshell:
      "Insurance doesn't grow your wealth — it protects your wealth from being destroyed. Think of it as a seatbelt for your finances.",
    inKifedha:
      "We help you track your insurance policies, remind you of premium due dates, and show coverage gaps. Our AI compares your insurance spending against benchmarks.",
    example:
      "A KSh 300,000 hospital bill wipes 5 years of savings. A KSh 1,500/month health cover absorbs it instead.",
    extra: <InsuranceDeepDive />,
  },
];

interface GlossaryTerm {
  term: string;
  pillar: PillarKey;
  def: string;
  example: string;
  /** key in app/automation state that signals "in use" */
  usedWhen?: (ctx: UsedCtx) => boolean;
}

export interface UsedCtx {
  roundUps: boolean;
  autopilot: boolean;
  autoSweep: boolean;
  hasDebt: boolean;
  hasGoals: boolean;
  hasHealth: boolean;
  hasLife: boolean;
  hasEmergency: boolean;
  highCardSpend: boolean;
}

export const GLOSSARY: GlossaryTerm[] = [
  // Budgeting
  { term: "50/30/20 Rule", pillar: "budgeting", def: "Split take-home pay: 50% needs, 30% wants, 20% savings.", example: "KSh 60k income → 30k needs, 18k wants, 12k savings." },
  { term: "Cash Flow", pillar: "budgeting", def: "Money coming in minus money going out over a period.", example: "Income 60k − expenses 45k = +15k positive cash flow." },
  { term: "Discretionary Spending", pillar: "budgeting", def: "Optional, non-essential spending you can cut.", example: "Nyama choma weekends, streaming bundles." },
  { term: "Fixed Expense", pillar: "budgeting", def: "A bill that stays the same each month.", example: "Rent of KSh 18,000." },
  { term: "Safe-to-Spend", pillar: "budgeting", def: "What's left today after bills, savings and goals.", example: "Kifedha home shows: 'Safe to spend today: KSh 420.'" },

  // Saving
  { term: "Emergency Fund", pillar: "saving", def: "3–6 months of expenses kept liquid for shocks.", example: "Monthly expenses 30k → target 90–180k.", usedWhen: c => c.hasEmergency },
  { term: "High-Yield Account", pillar: "saving", def: "Account paying meaningfully more interest than a current account.", example: "MMF at ~10% vs bank at 2%." },
  { term: "Round-Ups", pillar: "saving", def: "Rounding each spend to the nearest 10/100 and saving the difference.", example: "Pay 270 → 30 swept to savings.", usedWhen: c => c.roundUps },
  { term: "Sinking Fund", pillar: "saving", def: "A pot you fill monthly for a known future cost.", example: "KSh 2,000/mo for December school fees." },
  { term: "Auto-Sweep", pillar: "saving", def: "Automatic transfer of idle cash into a higher-yield pot.", example: "Balance over 20k? Sweep the surplus.", usedWhen: c => c.autoSweep },

  // Debt
  { term: "APR", pillar: "debt", def: "Annual cost of a loan including interest and fees.", example: "Mobile loan 7%/mo ≈ 84% APR." },
  { term: "Avalanche Method", pillar: "debt", def: "Pay minimums everywhere, kill the highest-interest debt first.", example: "Mobile loan first, SACCO last.", usedWhen: c => c.hasDebt },
  { term: "Snowball Method", pillar: "debt", def: "Kill the smallest balance first for quick wins.", example: "Clear KSh 5k Fuliza, then tackle bigger loans.", usedWhen: c => c.hasDebt },
  { term: "Debt-to-Income (DTI)", pillar: "debt", def: "Monthly debt payments ÷ monthly income.", example: "Repayments 12k / income 60k = 20% DTI." },
  { term: "Principal", pillar: "debt", def: "The original amount borrowed, before interest.", example: "Borrow 50k → 50k is the principal." },

  // Investing
  { term: "Compounding", pillar: "investing", def: "Earning returns on your returns over time.", example: "10% on 100k = 110k. Next year 10% on 110k = 121k." },
  { term: "Diversification", pillar: "investing", def: "Spreading money across assets to reduce risk.", example: "Mix MMF, T-bills, NSE shares, SACCO." },
  { term: "MMF (Money Market Fund)", pillar: "investing", def: "Low-risk fund investing in short-term debt; pays daily interest.", example: "Sanlam, CIC, Britam MMFs ~9–11% p.a." },
  { term: "T-Bill", pillar: "investing", def: "Short-term government loan you can buy via CBK.", example: "91-day T-bill at ~15% p.a." },
  { term: "Risk Tolerance", pillar: "investing", def: "How much volatility you can stomach without panic-selling.", example: "Low: MMF only. High: 60% NSE shares." },

  // Credit
  { term: "Credit Score", pillar: "credit", def: "A number lenders use to predict if you'll repay.", example: "CRB rating: A (best) to E (worst)." },
  { term: "Credit Utilization", pillar: "credit", def: "Card balance ÷ card limit. Keep under 30%.", example: "100k limit → keep balance under 30k.", usedWhen: c => c.highCardSpend },
  { term: "CRB Listing", pillar: "credit", def: "Negative report filed when you default in Kenya.", example: "Default 3+ months → listed on Metropol/TransUnion." },
  { term: "Hard Inquiry", pillar: "credit", def: "A lender pulls your credit; can dent your score briefly.", example: "Applying for 4 loans in a week." },
  { term: "Minimum Payment", pillar: "credit", def: "Smallest amount due to keep an account current.", example: "Card 80k balance, min payment 4k." },

  // Insurance
  { term: "Premium", pillar: "insurance", def: "What you pay (monthly/yearly) to keep cover active.", example: "KSh 1,800/month for family health cover.", usedWhen: c => c.hasHealth || c.hasLife },
  { term: "Deductible", pillar: "insurance", def: "What you pay out of pocket before insurance kicks in.", example: "10k deductible: bill 50k → you pay 10k, insurer 40k." },
  { term: "Copay", pillar: "insurance", def: "Fixed fee you pay per visit/service.", example: "KSh 500 per outpatient visit." },
  { term: "Coinsurance", pillar: "insurance", def: "Percentage of a bill you share after the deductible.", example: "20% coinsurance on a 100k bill = you pay 20k." },
  { term: "Out-of-Pocket Maximum", pillar: "insurance", def: "Annual cap on what you'll personally pay.", example: "Cap 80k → insurer covers 100% above that." },
  { term: "Coverage Limit", pillar: "insurance", def: "Maximum the insurer will pay per claim or per year.", example: "Inpatient limit KSh 1,000,000 per year." },
  { term: "Beneficiary", pillar: "insurance", def: "Person who receives the payout if you die.", example: "Spouse named on a term-life policy." },
  { term: "Rider", pillar: "insurance", def: "Add-on that extends a base policy.", example: "Critical-illness rider on life cover." },
  { term: "Underinsured", pillar: "insurance", def: "Cover too small to absorb a real-world loss.", example: "200k life cover with 3 dependents = underinsured." },
  { term: "Cash Value", pillar: "insurance", def: "Savings portion inside a whole-life policy (often low return).", example: "Whole life builds slow cash value vs MMF growth." },
];

// ---------- Insurance deep dive ----------
function InsuranceDeepDive() {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h4 className="font-semibold mb-2">The Role of Insurance in Wealth Building</h4>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li><span className="text-foreground font-medium">Prevents debt spiral</span> — one hospital trip won't push you into mobile loans.</li>
          <li><span className="text-foreground font-medium">Preserves compound growth</span> — you don't liquidate your MMF to pay a bill.</li>
          <li><span className="text-foreground font-medium">Enables risk-taking</span> — you can start a business knowing your family is covered.</li>
          <li><span className="text-foreground font-medium">Protects assets</span> — your car, home and stock are shielded from one bad day.</li>
          <li><span className="text-foreground font-medium">Enables legacy</span> — term life ensures dependents keep their lifestyle and goals.</li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold mb-2">The 4 Types of Insurance Everyone Needs</h4>
        <div className="overflow-x-auto -mx-2 px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>What it protects</TableHead>
                <TableHead>When to get it</TableHead>
                <TableHead>Wealth impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Health</TableCell>
                <TableCell>1 — Critical</TableCell>
                <TableCell>Medical bills, hospitalisation</TableCell>
                <TableCell>Today</TableCell>
                <TableCell>Stops biggest wealth-killer</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Disability</TableCell>
                <TableCell>2 — High</TableCell>
                <TableCell>Income if you can't work</TableCell>
                <TableCell>Once you have dependents/income</TableCell>
                <TableCell>Replaces your earning power</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Term Life</TableCell>
                <TableCell>3 — High (if dependents)</TableCell>
                <TableCell>Family income on death</TableCell>
                <TableCell>When others rely on you</TableCell>
                <TableCell>Protects legacy & goals</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Auto / Home</TableCell>
                <TableCell>4 — As needed</TableCell>
                <TableCell>Major assets you own</TableCell>
                <TableCell>On purchase</TableCell>
                <TableCell>Shields balance sheet</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h4 className="font-semibold mb-2">Common Mistakes to Avoid</h4>
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li>Skipping health insurance to save a few thousand a month.</li>
          <li>Buying whole life as an "investment" — returns usually trail an MMF.</li>
          <li>Choosing the lowest deductible — premiums balloon for little benefit.</li>
          <li>Not updating beneficiaries after marriage, divorce or new children.</li>
          <li>Being underinsured — buying a tiny policy that won't cover real losses.</li>
        </ol>
      </section>

      <section className="rounded-lg border bg-muted/40 p-3">
        <h4 className="font-semibold mb-1">The 1% Rule</h4>
        <p className="text-muted-foreground">
          Spend <span className="text-foreground font-medium">1–3% of gross income</span> on insurance premiums (excluding health). On KSh 60,000/mo that's KSh 600–1,800.
        </p>
      </section>

      <section>
        <h4 className="font-semibold mb-2">Connection to Other Pillars</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            ["Budgeting", "Premiums are a fixed line item."],
            ["Saving", "Protects your emergency fund from depletion."],
            ["Debt", "Stops a shock from forcing new loans."],
            ["Investing", "Lets compounding run uninterrupted."],
            ["Credit", "Avoid missed payments after a crisis."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-md border p-2 text-xs">
              <div className="font-medium">{t}</div>
              <div className="text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------- Progress storage ----------
export const VIEWED_KEY = "ywb_learn_viewed";
export function loadViewed(): { pillars: string[]; terms: string[] } {
  try {
    const s = localStorage.getItem(VIEWED_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { pillars: [], terms: [] };
}
function saveViewed(v: { pillars: string[]; terms: string[] }) {
  localStorage.setItem(VIEWED_KEY, JSON.stringify(v));
}

export interface LearnSuggestion {
  label: string;
  reason: string;
  type: "pillar" | "term";
  key: string;
}

export function computeLearnSuggestion(
  ctx: UsedCtx,
  viewed: { pillars: string[]; terms: string[] }
): LearnSuggestion | null {
  const candidates: LearnSuggestion[] = [];
  if (ctx.highCardSpend && !viewed.terms.includes("Credit Utilization"))
    candidates.push({ label: "Credit Utilization", reason: "Your card-style spending is high this month.", type: "term", key: "Credit Utilization" });
  if (ctx.hasDebt && !viewed.pillars.includes("debt"))
    candidates.push({ label: "Debt", reason: "You have active debts to plan around.", type: "pillar", key: "debt" });
  if (!ctx.hasHealth && !viewed.pillars.includes("insurance"))
    candidates.push({ label: "Insurance (Wealth Protection)", reason: "No health cover detected — biggest wealth risk.", type: "pillar", key: "insurance" });
  if (!ctx.hasEmergency && !viewed.terms.includes("Emergency Fund"))
    candidates.push({ label: "Emergency Fund", reason: "No emergency fund logged yet.", type: "term", key: "Emergency Fund" });
  if (candidates.length === 0) {
    const p = PILLARS.find(p => !viewed.pillars.includes(p.key));
    if (p) candidates.push({ label: p.title, reason: "Next pillar to learn.", type: "pillar", key: p.key });
    else {
      const t = GLOSSARY.find(t => !viewed.terms.includes(t.term));
      if (t) candidates.push({ label: t.term, reason: "Next glossary term.", type: "term", key: t.term });
    }
  }
  return candidates[0] ?? null;
}

export const LEARN_TOTAL_TOPICS = 6 + 30; // 6 pillars + 30 glossary terms = 36

// ---------- Page ----------
export default function Learn() {
  const { financials, automation } = useApp();
  const { transactions } = useTransactions();
  const [openPillar, setOpenPillar] = useState<PillarKey | null>(null);
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewed, setViewed] = useState(loadViewed());

  useEffect(() => saveViewed(viewed), [viewed]);

  // Estimate "high card spend" via transactions tagged Bills/Shopping totalling > 30k this month
  const highCardSpend = useMemo(() => {
    const m = new Date().getMonth();
    return transactions
      .filter(t => t.type === "expense" && new Date(t.date).getMonth() === m)
      .reduce((s, t) => s + t.amount, 0) > 30000;
  }, [transactions]);

  const usedCtx: UsedCtx = {
    roundUps: automation.roundUps,
    autopilot: automation.autopilotGoals,
    autoSweep: automation.autoSweepSurplus,
    hasDebt: !!financials && financials.totalDebt > 0,
    hasGoals: !!financials && financials.goals.length > 0,
    hasHealth: !!financials?.hasHealthInsurance,
    hasLife: !!financials?.hasLifeInsurance,
    hasEmergency: !!financials?.hasEmergencyFund,
    highCardSpend,
  };

  const togglePillar = (k: PillarKey) => {
    setOpenPillar(openPillar === k ? null : k);
    if (!viewed.pillars.includes(k))
      setViewed(v => ({ ...v, pillars: [...v.pillars, k] }));
  };

  const toggleTerm = (term: string) => {
    setOpenTerm(openTerm === term ? null : term);
    if (!viewed.terms.includes(term))
      setViewed(v => ({ ...v, terms: [...v.terms, term] }));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? GLOSSARY.filter(t => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
      : GLOSSARY;
    return [...list].sort((a, b) => a.term.localeCompare(b.term));
  }, [search]);

  const grouped = useMemo(() => {
    const map: Record<string, GlossaryTerm[]> = {};
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      (map[letter] ||= []).push(t);
    }
    return map;
  }, [filtered]);

  const totalItems = PILLARS.length + GLOSSARY.length;
  const doneItems = viewed.pillars.length + viewed.terms.length;
  const pct = Math.round((doneItems / totalItems) * 100);

  // Suggest next: prioritize pillar with strongest signal
  const suggestion = useMemo(
    () => computeLearnSuggestion(usedCtx, viewed),
    [usedCtx, viewed]
  );

  const continueLearning = () => {
    if (!suggestion) return;
    if (suggestion.type === "pillar") togglePillar(suggestion.key as PillarKey);
    else {
      toggleTerm(suggestion.key);
      const el = document.getElementById(`term-${suggestion.key}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const shareProgress = () => {
    const text = `I've completed ${doneItems}/${totalItems} financial topics on Kifedha! 📚\n\nHaba na haba hujaza kibaba — little by little fills the measure.\n\nJoin me: https://www.kifedha.app`;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  const continueLearning = () => {
    if (!suggestion) return;
    if (suggestion.type === "pillar") togglePillar(suggestion.key as PillarKey);
    else {
      toggleTerm(suggestion.key);
      const el = document.getElementById(`term-${suggestion.key}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Learn</h1>
          <Badge variant="secondary" className="ml-auto">{doneItems}/{totalItems}</Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Your progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={pct} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{viewed.pillars.length}/{PILLARS.length} pillars</span>
              <span>{viewed.terms.length}/{GLOSSARY.length} terms</span>
            </div>
            {suggestion && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                <div className="text-xs text-muted-foreground">Suggested next</div>
                <div className="font-medium">{suggestion.label}</div>
                <div className="text-xs text-muted-foreground">{suggestion.reason}</div>
                <Button size="sm" onClick={continueLearning}>Continue learning</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pillars */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Key pillars</h2>
          <div className="space-y-2">
            {PILLARS.map(p => {
              const Icon = p.icon;
              const open = openPillar === p.key;
              const seen = viewed.pillars.includes(p.key);
              return (
                <Collapsible key={p.key} open={open} onOpenChange={() => togglePillar(p.key)}>
                  <Card className={seen ? "border-primary/30" : ""}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-3 p-4 text-left">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{p.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.nutshell}</div>
                        </div>
                        {seen && <Badge variant="secondary" className="text-[10px]">Read</Badge>}
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3 text-sm">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">In a nutshell</div>
                          <p>{p.nutshell}</p>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">In Kifedha</div>
                          <p>{p.inKifedha}</p>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Example</div>
                          <p className="text-muted-foreground">{p.example}</p>
                        </div>
                        {p.extra}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </section>

        {/* Glossary */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Glossary (A–Z)</h2>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search terms..."
              className="pl-9"
            />
          </div>
          <div className="space-y-4">
            {Object.keys(grouped).sort().map(letter => (
              <div key={letter}>
                <div className="text-xs font-semibold text-muted-foreground mb-1 px-1">{letter}</div>
                <div className="space-y-1">
                  {grouped[letter].map(t => {
                    const open = openTerm === t.term;
                    const used = t.usedWhen ? t.usedWhen(usedCtx) : false;
                    const seen = viewed.terms.includes(t.term);
                    return (
                      <Collapsible key={t.term} open={open} onOpenChange={() => toggleTerm(t.term)}>
                        <Card id={`term-${t.term}`} className={seen ? "border-primary/30" : ""}>
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center gap-2 p-3 text-left">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{t.term}</div>
                                <div className="text-xs text-muted-foreground capitalize">{t.pillar}</div>
                              </div>
                              {used && <Badge className="text-[10px]">Used in Kifedha</Badge>}
                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-3 pb-3 text-sm space-y-2">
                              <p>{t.def}</p>
                              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Example: </span>{t.example}</p>
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No terms match "{search}".</p>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
