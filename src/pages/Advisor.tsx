import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Send, Sparkles, Lock, Loader2, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { generateInsights } from "@/lib/insightsEngine";

interface Msg { role: "user" | "assistant"; content: string }

const FREE_TURN_LIMIT = 6; // free users can exchange ~6 messages before paywall

export default function Advisor() {
  const navigate = useNavigate();
  const { financials, blueprint, isPremium, isTrialing, trialDaysLeft, hasCompletedOnboarding } = useApp();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasCompletedOnboarding) navigate("/onboarding");
  }, [hasCompletedOnboarding, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Kick off the call automatically with an opening
  useEffect(() => {
    if (messages.length === 0 && financials) {
      void send("__START__", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financials]);

  const userTurnCount = messages.filter(m => m.role === "user" && m.content !== "__START__" && m.content !== "Hi, I'm ready to start.").length;
  const limitReached = !isPremium && userTurnCount >= FREE_TURN_LIMIT;

  async function send(text: string, isOpener = false) {
    if (!text.trim() || isLoading) return;
    if (limitReached && !isOpener) {
      setPaywallOpen(true);
      return;
    }

    const userMsg: Msg = { role: "user", content: isOpener ? "Hi, I'm ready to start." : text };
    const nextMessages = isOpener ? [userMsg] : [...messages, userMsg];
    setMessages(nextMessages);
    if (!isOpener) setInput("");
    setIsLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-advisor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: nextMessages,
          financials,
          blueprint,
          isPremium,
          insights: financials && blueprint ? generateInsights(financials, blueprint) : [],
        }),
      });

      if (resp.status === 429) { toast.error("Too many requests. Please wait a moment."); setIsLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setIsLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Advisor unavailable. Try again."); setIsLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantSoFar = "";
      let done = false;

      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection lost. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full gradient-premium flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-premium-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-base leading-tight flex items-center gap-1.5">
              AI Financial Advisor
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-semibold">
                  <Crown className="w-3 h-3" /> Premium{isTrialing ? ` · ${trialDaysLeft}d` : ""}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {isPremium ? "Full diagnosis enabled" : `Free plan · ${Math.max(0, FREE_TURN_LIMIT - userTurnCount)} messages left`}
            </p>
          </div>
          <button
            onClick={() => navigate("/assessment/risk-profile")}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted"
            title="Risk assessment"
          >
            Risk
          </button>
          {!isPremium && (
            <button
              onClick={() => navigate("/advisor/upgrade")}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg gradient-premium text-premium-foreground shadow-card"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="max-w-lg mx-auto w-full px-4 pt-3">
          <button
            onClick={() => navigate("/advisor/upgrade")}
            className="w-full rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-left hover:bg-warning/10 transition"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-foreground">Your free plan</span>
              <span className="text-[10px] font-semibold text-warning">See all premium benefits →</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              Includes 2 goals, basic debt plan, and {Math.max(0, FREE_TURN_LIMIT - userTurnCount)} advisor messages left.
            </p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-premium"
                style={{ width: `${Math.min(100, (userTurnCount / FREE_TURN_LIMIT) * 100)}%` }}
              />
            </div>
          </button>
        </div>
      )}



      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {messages.length === 0 && isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
            </div>
          )}
          {messages.filter(m => m.content !== "__START__" && m.content !== "Hi, I'm ready to start.").map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card shadow-card rounded-bl-md"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground prose-headings:text-foreground">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-card shadow-card rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {limitReached && !isPremium && (
            <div className="mt-4 rounded-xl border border-border bg-card p-5 text-center shadow-card">
              <div className="w-12 h-12 rounded-full gradient-premium flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5 text-premium-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">Unlock the full diagnosis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get your personalized Financial Blueprint — exact KES allocations, gap fixes, and a 3-step action plan.
              </p>
              <button
                onClick={() => navigate("/advisor/upgrade")}
                className="w-full py-3 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm shadow-elevated"
              >
                Upgrade — $8/month
              </button>
              <p className="text-xs text-muted-foreground mt-2">7-day free trial · ≈ KES 1,040/mo</p>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(input); }}
            placeholder={limitReached ? "Upgrade to continue…" : "Type your reply…"}
            disabled={isLoading || limitReached}
            className="flex-1 bg-muted/60 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <button
            onClick={() => send(input)}
            disabled={isLoading || !input.trim() || limitReached}
            className="w-11 h-11 rounded-xl gradient-gold text-warning-foreground flex items-center justify-center shadow-elevated disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
