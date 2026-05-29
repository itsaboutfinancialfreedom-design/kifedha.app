import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cycle = params.get("cycle") || "monthly";
  const { trialDaysLeft } = useApp();

  useEffect(() => {
    const end = Date.now() + 1500;
    const colors = ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    const t = setTimeout(() => navigate("/dashboard"), 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full gradient-premium flex items-center justify-center mx-auto mb-5 shadow-elevated">
            <CheckCircle2 className="w-10 h-10 text-premium-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Welcome to Premium!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your 7-day free trial has started{trialDaysLeft ? ` (${trialDaysLeft} days left)` : ""}. You're now on the {cycle} plan — cancel anytime.
          </p>

          <div className="rounded-xl border border-border bg-card p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2 text-warning">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Unlocked features</span>
            </div>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li>• Unlimited savings goals</li>
              <li>• Advanced debt simulator</li>
              <li>• PDF financial reports</li>
              <li>• AI advisor chat</li>
              <li>• Email reminders & weekly digest</li>
            </ul>
          </div>

          <div className="space-y-2">
            <button onClick={() => navigate("/advisor")} className="w-full py-3 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm shadow-elevated">
              Open Financial Advisor
            </button>
            <button onClick={() => navigate("/dashboard")} className="w-full py-3 rounded-xl bg-muted text-foreground font-semibold text-sm">
              Back to dashboard
            </button>
            <p className="text-[11px] text-muted-foreground pt-2">Redirecting to dashboard in 5s…</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
