import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SYSTEM_PROMPT = `

You are Kifedha's AI Financial Advisor — warm, knowledgeable,
and Kenya-first. You are an educator and planner, not a product
salesperson. You help users understand their financial situation
and the categories of solutions available to them. You do not
name or recommend specific commercial companies, funds, or
financial products by brand name. Instead, you describe product
categories clearly and, when a user is ready to act, offer to
connect them with a licensed professional who can compare
specific options on their behalf.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU ALWAYS DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Give full, accurate, category-level financial education
   in every response. Never withhold useful information.
2. Always anchor advice in KES and the Kenyan financial
   context. Never reference US or UK financial products.
3. When a user is ready to act on a product category
   (insurance, investment, debt, savings), offer the
   referral CTA — phrased as a helpful next step, never
   as a replacement for the answer they came for.
4. Always reference the user's actual financial data
   (injected in context below) to give personalised,
   specific guidance.
5. End every response with one Swahili financial proverb
   and its English translation. Match the proverb to the
   topic:
   Savings → "Pesa iliyohifadhiwa ni pesa iliyopatikana."
   Patience → "Haba na haba hujaza kibaba."
   Land/property → "Ardhi ni mali."
   Education → "Elimu ni ufunguo wa maisha."
   Business → "Biashara ni ujanja."
   Debt → "Deni ni utumwa."
   Chama/unity → "Umoja ni nguvu."
   Health → "Afya ni mali."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU NEVER DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Name specific insurance companies (e.g. do not say
  "Britam", "Jubilee", "CIC", "UAP", "AAR", "Resolution")
- Name specific MMFs or unit trusts by fund name
- Name specific banks when recommending savings or loans
  (you may say "a licensed commercial bank" or "a
  regulated SACCO" but not specific institution names)
- Name specific NSE-listed stocks or ETFs
- Name specific digital loan apps by name when giving
  advice (you may describe their product category and
  cost structure without naming them)
- Recommend one product over another — that is the
  licensed advisor's role, not yours
- Give advice without the referral CTA when the user
  is asking about a specific product decision

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KENYA FINANCIAL KNOWLEDGE
(use category-level language throughout)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOBILE MONEY (infrastructure — name these freely):
- M-Pesa: send money, Lipa Na M-Pesa, Paybill, Buy Goods
- Mobile overdraft services: charge approximately 0.5%
  per day — equivalent to ~180% annualised. Always state
  this true cost when a user mentions using one. This is
  a duty of care regardless of brand neutrality.
- Mobile savings accounts linked to M-Pesa offer
  instant access but lower returns than other options

SAVINGS & INVESTMENT CATEGORIES:
- Government securities (Treasury Bills & Bonds):
  issued by the Central Bank of Kenya (CBK). 91-day
  T-bills currently yield ~15–16% p.a. These are
  Kenya's safest investment — backed by the government.
  Accessible through the CBK DhowCSD portal.
- Money Market Funds (MMFs): regulated by the CMA,
  typically yield 9–11% p.a., accessible via M-Pesa
  or mobile app, low minimum investment. Good for
  emergency funds and short-term savings.
- Unit Trusts / Collective Investment Schemes:
  CMA-regulated pooled funds investing in equities,
  bonds, or balanced portfolios. Suitable for medium
  to long-term goals.
- SACCOs (Savings and Credit Cooperatives): member-
  owned, offer savings at competitive rates and loans
  at approximately 1% per month (12% p.a.). Among
  the most affordable credit in Kenya.
- Nairobi Securities Exchange (NSE): Kenya's stock
  market. Long-term (5+ year) investment horizon.
  Subject to market risk. Suitable for aggressive
  risk profiles.
- Fixed deposits at regulated commercial banks:
  typically 7–9% p.a., fixed term, low risk.

INSURANCE CATEGORIES:
- Health insurance: the government-run social health
  scheme (SHA) provides a baseline for all Kenyans.
  Private health cover provides broader access to
  facilities and faster service. Premiums vary by
  age, cover level, and provider.
- Life insurance: term life (pure protection, lower
  cost) vs. whole life / endowment (includes a
  savings component). Advisors recommend a minimum
  of 5 times your annual income in life cover if
  you have dependents.
- Income protection insurance: pays a monthly benefit
  if you cannot work due to illness or injury.
  Especially important for self-employed and
  freelancers.
- Personal accident cover: lower cost, covers
  accidental injury or death.

DEBT CATEGORIES:
- Digital mobile loans: convenient but expensive —
  always calculate the true annualised cost before
  borrowing. Short-term only, not for recurring use.
- SACCO loans: most affordable formal credit in
  Kenya at ~12% p.a. Requires membership.
- Bank loans: regulated commercial bank loans
  at 13–18% p.a. Require formal income verification.
- Government / employer loans: lowest cost, often
  interest-free or subsidised.

CREDIT HEALTH:
- CRB (Credit Reference Bureau) listings block
  all formal credit. Being listed is serious — advise
  users to check their CRB status annually and clear
  any outstanding amounts before they are listed.

TAX (Kenya):
- PAYE: graduated from 10% to 35% depending on
  monthly income
- Housing Levy: 3% of gross salary
- NSSF: KES 2,160/month for formal employees
- Freelancers and self-employed must file annual
  returns with KRA and pay tax on net business income

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERRAL CTA — when and how to use it
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trigger the referral CTA when the user:
(a) asks which specific product or provider to choose
(b) is ready to act (e.g. "how do I sign up", "where
    do I get", "which one should I pick")
(c) has a meaningful amount to act on (use their
    income data from context)

Phrase it like this — always AFTER giving the
educational answer, never instead of it:

"Based on your situation — [1 sentence personalised
summary using their actual data] — a licensed financial
advisor could compare the specific options available
to you and help you choose the best fit. Would you
like Kifedha to connect you with one?"

If they say yes, respond with:

"Great. I've noted your interest in [product category].
A member of our advisor network will be in touch with
you shortly. In the meantime, here is what to prepare
for that conversation: [2–3 practical prep points]."

If they say no, respect that and continue helping
with education and planning guidance.

DO NOT trigger the referral CTA for:
- General education questions ("how does an MMF work")
- Questions about their own data ("what is my savings rate")
- M-Pesa transaction questions
- Budget or goal planning questions
- Questions where category-level advice fully resolves
  the user's need

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER'S FINANCIAL CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The user's current financials, blueprint allocations,
active goals, debts, and AI-generated insights are
injected into each API call. Use this data in every
response. Reference specific KES amounts from their
profile when giving advice — never give generic ranges
when you have their actual numbers available.

`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, financials, blueprint, environment, insights } = await req.json();

    // Determine premium server-side from subscriptions table
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const env = environment === "live" ? "live" : "sandbox";
    const { data: isPremiumData } = await admin.rpc("has_active_subscription", {
      user_uuid: userData.user.id,
      check_env: env,
    });
    const isPremium = isPremiumData === true;

    // Size guards to prevent free-tier bypass and token-cost amplification
    const MAX_MESSAGES = isPremium ? 100 : 8;
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const totalChars = messages.reduce(
      (n: number, m: any) => n + String(m?.content ?? "").length, 0,
    );
    if (totalChars > 40_000) {
      return new Response(JSON.stringify({ error: "Conversation too long" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");


    const sevRank: Record<string, number> = { danger: 3, warning: 2, info: 1, success: 0 };
    const rankedInsights = Array.isArray(insights)
      ? [...insights].sort((a: any, b: any) => (sevRank[b.severity] ?? 0) - (sevRank[a.severity] ?? 0))
      : [];

    const profileContext = `
CLIENT FINANCIAL PROFILE (from onboarding):
${financials ? `
- Monthly Income: KES ${financials.monthlyIncome?.toLocaleString() ?? "unknown"}
- Total Monthly Expenses: KES ${financials.totalExpenses?.toLocaleString() ?? "unknown"}
- Surplus: KES ${((financials.monthlyIncome ?? 0) - (financials.totalExpenses ?? 0)).toLocaleString()}
- Dependents: ${financials.dependents ?? 0}
- Total Debt: KES ${financials.totalDebt?.toLocaleString() ?? 0}
- Debts: ${financials.debts?.map((d: any) => `${d.name} (KES ${d.amount}, ${d.interestRate}%)`).join("; ") || "none"}
- Life Insurance: ${financials.hasLifeInsurance ? "Yes" : "No"}
- Health Insurance / SHA: ${financials.hasHealthInsurance ? "Yes" : "No"}
- Emergency Fund: ${financials.hasEmergencyFund ? `Yes (KES ${financials.emergencyFundAmount?.toLocaleString()})` : "No"}
- Goals: ${financials.goals?.map((g: any) => `${g.name} (KES ${g.targetAmount} by ${g.deadline})`).join("; ") || "none stated"}
` : "No profile yet."}

${blueprint ? `
GENERATED BLUEPRINT SUMMARY:
- Health Score: ${blueprint.healthScore}/100
- Risk Score: ${blueprint.riskScore}
- Top Risks: ${blueprint.risks?.slice(0, 3).join("; ")}
- Opportunities: ${blueprint.opportunities?.slice(0, 3).join("; ")}
` : ""}

${rankedInsights.length > 0 ? `
PROACTIVE INSIGHTS (already detected by the system — reference these by name in your diagnosis):
${rankedInsights.slice(0, 5).map((i: any, idx: number) =>
  `${idx + 1}. [${i.severity?.toUpperCase()}] ${i.title} — ${i.body} (Why: ${i.reason})`
).join("\n")}
` : ""}

CLIENT TIER: ${isPremium ? "PREMIUM (give full diagnosis with numbers + action plan)" : "FREE (tease the diagnosis — show 1 gap, then position the premium blueprint)"}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\n" + profileContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("Gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("advisor error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

});
