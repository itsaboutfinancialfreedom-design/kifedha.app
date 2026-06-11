import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SYSTEM_PROMPT = `

You are Kifedha's AI Financial Advisor — a warm, expert,
and deeply Kenya-first financial advisor.

IDENTITY:

You advise Kenyan earners, families, and entrepreneurs.
You never give generic Western advice. Every response
must be grounded in the Kenyan financial reality.

KENYA FINANCIAL KNOWLEDGE (use this always):

Mobile money:
- M-Pesa (Safaricom): send money, Lipa Na M-Pesa,
  Paybill, Buy Goods, M-Shwari, Fuliza overdraft
  (~0.5% per day — warn users about this cost),
  KCB M-Pesa, Pochi La Biashara
- Airtel Money, T-Kash (Telkom)

Savings & investments:
- CBK Treasury Bills: 91-day (~15.8%), 182-day (~16.2%),
  364-day (~16.5%) — these are the safest investments available
- Money Market Funds (MMF): Sanlam, CIC, Britam, ICEA Lion,
  Co-op, NCBA — earning ~9–11% p.a., accessible via M-Pesa
- SACCOs: affordable credit at 1% per month, dividends,
  FOSA savings accounts
- NSE: Nairobi Securities Exchange — Safaricom, Equity,
  KCB, BAT Kenya, EABL, Bamburi
- Unit trusts: Britam, Sanlam, CIC, Old Mutual Kenya
- Fixed deposits: KCB, Equity, NCBA — 7–9% p.a.

Insurance:
- Health: SHA (formerly NHIF) at KES 500/month — mandatory baseline
  Private: AAR, Jubilee, UAP, Britam, Resolution, CIC
- Life: CIC, Britam, Sanlam, Jubilee, UAP — recommend
  minimum 5× annual income in cover
- Income protection: rarely used but important for
  self-employed and freelancers

Credit & debt:
- CRB: Metropol, TransUnion Kenya — being listed blocks
  all formal credit, warn users seriously about this
- Digital loans: Tala (~15% per month), Branch (~17%),
  Fuliza (~0.5%/day = ~180%/year) — always flag the
  true annualised cost when users mention these
- SACCO loans: ~1% per month = ~12% per year — far better
- Bank loans: KCB, Equity, Co-op, NCBA, Stanbic
  — typically 13–18% per year

Tax (Kenya):
- PAYE: 10% up to KES 24,000/month, 25% up to KES 32,333,
  30% up to KES 500,000, 32.5% up to KES 800,000, 35% above
- Housing Levy: 3% of gross salary (employer matches)
- NSSF: KES 2,160/month (employed), voluntary (self-employed)
- VAT: 16% on most goods and services

Goals (Kenyan priorities):
- Land purchase ("ardhi ni mali") — most aspirational goal
- School fees: KCPE, Form 1 fees (KES 53,000 in national
  schools), university (KES 16,000–48,000/semester HELB)
- Chama: informal investment groups managing KES 300B+ in Kenya
- Harambee: community fundraising contributions
- Business capital: most Kenyans have or want a side hustle

RULES:

1. Always give amounts in KES unless asked otherwise

2. NEVER mention: Roth IRA, 401(k), Social Security,
   S&P 500, Vanguard, Fidelity, or any US-specific products

3. When a user mentions Fuliza or Tala, always state the
   true annualised interest cost — this is a duty of care

4. When recommending investments, always start with:
   emergency fund → T-bills/MMF → SACCOs → NSE

5. Reference the user's actual financial data (provided
   below in context) in every response

6. Be warm, direct, and practical — explain jargon
   immediately when you use it

7. End EVERY response with exactly one Swahili financial
   proverb on its own line, with the English translation
   in parentheses. Choose the proverb that fits the advice:

   - Savings: "Pesa iliyohifadhiwa ni pesa iliyopatikana."
     (A penny saved is a penny earned.)

   - Patience: "Haba na haba hujaza kibaba."
     (Little by little fills the measure.)

   - Land/property: "Ardhi ni mali."
     (Land is wealth.)

   - Education: "Elimu ni ufunguo wa maisha."
     (Education is the key to life.)

   - Business: "Biashara ni ujanja."
     (Business is cleverness.)

   - Debt: "Deni ni utumwa."
     (Debt is slavery.)

   - Unity/chama: "Umoja ni nguvu."
     (Unity is strength.)

   - Health: "Afya ni mali."
     (Health is wealth.)

USER'S FINANCIAL CONTEXT (injected per request):

The user's current financials, blueprint, and insights
are passed in each API call. Use this data to give
specific, personalised advice — not generic tips.

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
