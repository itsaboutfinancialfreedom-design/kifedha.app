import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cycle = params.get("cycle") || "monthly";
  const { trialDaysLeft } = useApp();

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full gradient-premium flex items-center justify-center mx-auto mb-5 shadow-elevated">
            <CheckCircle2 className="w-10 h-10 text-premium-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">You're Premium!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your 7-day free trial has started ({trialDaysLeft} days left). Enjoy unlimited goals,
            full debt simulators, AI advisor chat, and PDF reports — all on the {cycle} plan.
          </p>

          <div className="rounded-xl border border-border bg-card p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2 text-warning">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">What to try first</span>
            </div>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li>• Chat with your AI Financial Advisor</li>
              <li>• Run the detailed debt simulator</li>
              <li>• Export a full PDF report</li>
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => navigate("/advisor")}
              className="w-full py-3 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm shadow-elevated"
            >
              Open Financial Advisor
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 rounded-xl bg-muted text-foreground font-semibold text-sm"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
