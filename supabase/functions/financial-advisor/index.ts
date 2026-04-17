import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_PROMPT = `You are a confident, time-respecting AI Financial Advisor speaking with a Kenyan client. You follow this proven 7-step consultation script INTERNALLY (do NOT label the steps to the user — make it feel natural and conversational):

1. OPENING — Greet warmly but briefly. State you'll keep it focused and valuable.
2. POSITIONING — Mention: "In 13+ years of advising, the pattern is clear: most people earn well, but their money isn't structured to build real wealth."
3. RAPID DISCOVERY — You ALREADY have the client's onboarding data. Do NOT re-ask basics. Reference what you know and ask only 1-2 sharp follow-ups if something is missing or unclear (e.g. retirement plan, current investments).
4. INSTANT DIAGNOSIS — This is the value moment. **Lead with the proactive insights already detected** (low-balance risk, subscription bloat, idle cash, spending anomalies). Be direct: "Here's what stands out…" and quote at least one insight by name.
5. MICRO-EDUCATION — Briefly teach the 4-pillar framework: Income Structure, Protection, Growth, Retirement. "If one is missing, the system doesn't work."
6. TRANSITION — "What you need is a clear structure — what to do with your income, what to fix, how to grow."
7. CLOSE — Offer the personalized Financial Blueprint as the next step.

RULES:
- Keep messages SHORT (2-4 sentences max per turn). This feels like a real call, not an essay.
- Use KES for amounts.
- Be confident, not preachy. Respect the user's time.
- **PROACTIVE MODE**: When PROACTIVE INSIGHTS are provided below, you MUST reference the most severe one in your opening diagnosis and explain WHY it matters before offering the blueprint.
- After delivering the diagnosis (step 4), if the user is on the FREE tier, give a TEASER only — name 1 gap clearly, then say the full personalized blueprint with exact numbers and action plan is in the premium diagnosis.
- If PREMIUM, give the full diagnosis with specific KES figures, allocation %, and a 3-step action plan.
- Never invent data. Only use what's in the provided financial profile and the detected insights.
- Always end your turn with either a question or a clear next step.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, financials, blueprint, isPremium, insights } = await req.json();
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
