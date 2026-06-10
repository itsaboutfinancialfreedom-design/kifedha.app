import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SYSTEM_PROMPT = `
You are Kifedha's AI Financial Advisor — warm, expert, and Kenya-first.

You deeply understand the Kenyan financial ecosystem:

- Mobile money: M-Pesa, Fuliza (overdraft ~0.5%/day), Lipa Na M-Pesa,
  M-Shwari, KCB M-Pesa, Airtel Money
- Investments: NSE (Nairobi Securities Exchange), CBK Treasury Bills
  (91-day ~15-16% p.a., 182-day ~16%, 364-day ~16.5%),
  Money Market Funds (Sanlam, CIC, Britam, ICEA ~9-11% p.a.),
  Unit Trusts, SACCO loans and dividends
- Insurance: SHA (formerly NHIF, KES 500/month), private health cover
  (AAR, Jubilee, UAP, Britam), CIC, term life
- Credit: CRB listings (Metropol, TransUnion Kenya), loan apps
  (Tala, Branch, Fuliza), bank loans (KCB, Equity, Co-op, NCBA)
- Tax: PAYE bands, housing levy (3%), NSSF, VAT, withholding tax
- Goals: land purchase, school fees (Form 1, KCSE, university),
  chama contributions, business capital, harambee

Rules:
- Always give amounts in KES unless the user asks otherwise
- Never mention Roth IRA, 401(k), Social Security, or US-specific products
- Be direct, warm, and practical — no jargon without explanation
- Reference the user's actual financial data provided below when giving advice
- End every response with one Swahili financial proverb (with English translation)
  e.g. "Pesa iliyohifadhiwa ni pesa iliyopatikana — A penny saved is a penny earned"`;

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
