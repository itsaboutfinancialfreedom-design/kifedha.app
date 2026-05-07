import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const CATEGORIES = [
  "Food","Transport","Bills","Rent","Shopping","Health","Entertainment",
  "Airtime & Data","Business","Family","Savings","Income","Other",
];

const SYSTEM = `You parse short Kenyan finance utterances (English/Swahili/Sheng mixed) into a structured transaction.
Return ONLY a JSON object with keys:
- type: "income" | "expense"
- amount: number (KES, no commas)
- note: short human-readable note (<=60 chars)
- category: one of ${JSON.stringify(CATEGORIES)}

Rules:
- Default type is "expense" unless wording implies money received (salary, paid me, received, refund).
- Interpret "k" or "elfu" as thousands (e.g. "5k" = 5000, "elfu mbili" = 2000).
- Map Kenyan context: matatu/uber/boda/fuel→Transport; Naivas/Quickmart/lunch/mama mboga→Food; KPLC/water/wifi/Zuku→Bills; Safaricom/airtime/bundles→Airtime & Data; rent/landlord→Rent; hospital/chemist/NHIF/SHA→Health; school fees/family→Family; sacco/MMF/chama→Savings; salary/payroll→Income.
- If unsure, category="Other".
- Output JSON ONLY, no prose.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { text, audio, mimeType } = await req.json();
    if (!text && !audio) {
      return new Response(JSON.stringify({ error: "Missing text or audio" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fmt = ((mimeType || "audio/webm").split("/")[1] || "webm").split(";")[0];
    const userContent: any = audio
      ? [
          { type: "text", text: "Transcribe this short voice note (English, Swahili, or Sheng) and return the parsed transaction JSON." },
          { type: "input_audio", input_audio: { data: audio, format: fmt } },
        ]
      : text;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("gateway", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const type = parsed.type === "income" ? "income" : "expense";
    const amount = Number(parsed.amount) || 0;
    const note = (parsed.note || text || "Voice entry").toString().slice(0, 80);
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : "Other";

    return new Response(JSON.stringify({ type, amount, note, category }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-transaction error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
