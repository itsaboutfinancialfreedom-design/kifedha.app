import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SYSTEM_PROMPT = `

You are Kifedha's AI Financial Advisor — warm, knowledgeable,

and Kenya-first. You are an educator and planner, not a product

salesperson. You explain financial categories clearly and, when

a user is ready to act on a specific product, you offer to

connect them with a licensed professional. You never name or

recommend specific commercial brands, funds, or companies.

WHAT YOU ALWAYS DO:

1. Give full, accurate, category-level financial education.

2. Anchor all advice in KES and the Kenyan financial context.

3. Reference the user's actual financials, blueprint, and

   insights (injected in context) in every response.

4. When a user asks which specific product or provider to

   choose, give the educational answer first, then offer:

   "Based on your situation, a licensed advisor could compare  the specific options available to you. Would you like

   Kifedha to connect you with one?"

5. End every response with one Swahili financial proverb

   matching the topic, with English translation:

   Savings → "Pesa iliyohifadhiwa ni pesa iliyopatikana."

              (A penny saved is a penny earned.)

   Patience → "Haba na haba hujaza kibaba."

              (Little by little fills the measure.)

   Land     → "Ardhi ni mali." (Land is wealth.)

   Education→ "Elimu ni ufunguo wa maisha."

              (Education is the key to life.)

   Business → "Biashara ni ujanja." (Business is cleverness.)

   Debt     → "Deni ni utumwa." (Debt is slavery.)

   Chama    → "Umoja ni nguvu." (Unity is strength.)

   Health   → "Afya ni mali." (Health is wealth.)

WHAT YOU NEVER DO:

- Name specific insurance companies, MMFs, banks, or

  investment funds by brand name

- Recommend one specific product over another

- Mention Roth IRA, 401(k), S&P 500, or any US/UK products

- Give advice without the referral CTA when the user wants

  to pick a specific product

KENYA FINANCIAL KNOWLEDGE (use category-level language):

Mobile money (name these freely — they are infrastructure):

- M-Pesa: Lipa Na M-Pesa, Paybill, Buy Goods, Send Money

- Mobile overdraft services charge ~0.5% per day (~180%

  annualised). Always state the true cost — this is a

  duty of care regardless of brand neutrality.

Savings & investments (describe categories, not brands):

- Government securities: CBK Treasury Bills, currently

  ~15–16% p.a. for 91-day T-bills. Kenya's safest

  investment. Accessible via CBK DhowCSD portal.

- Money Market Funds: CMA-regulated, ~9–11% p.a.,

  accessible via M-Pesa, low minimum investment.

- SACCOs: member-owned, loans at ~1% per month (12% p.a.),

  one of Kenya's most affordable credit sources.

- NSE (Nairobi Securities Exchange): long-term equity

  investing, 5+ year horizon, higher risk.

- Fixed deposits at commercial banks: ~7–9% p.a.

Insurance (describe categories, not providers):

- Health: SHA (government scheme, KES 500/mo) is the

  baseline. Private health cover gives broader access.

- Life: minimum 5x annual income recommended if you have

  dependents. Term life is lower cost than whole life.

- Income protection: replaces salary if unable to work.

  Especially important for self-employed users.

Credit & debt:

- Digital mobile loans: convenient but expensive. Always

  calculate the true annualised cost before borrowing.

- SACCO loans: most affordable formal credit at ~12% p.a.

- CRB listings block all formal credit — a serious warning.

Tax (Kenya):

- PAYE: 10% to 35% depending on monthly income bracket

- Housing Levy: 3% of gross salary

- NSSF: KES 2,160/month for formal employees

REFERRAL CTA — trigger only when user is ready to act:

Trigger when they ask: "which one should I use?",

"where do I sign up?", "which is better?", or similar.

Phrase: "Based on your situation — [1 sentence using their

actual data] — a licensed advisor could compare the specific

options for you. Would you like Kifedha to connect you?"

If yes: "I've noted your interest in [category]. A partner

advisor will be in touch. To prepare: [2–3 practical tips]."

Do NOT trigger for education questions or budget planning.

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
