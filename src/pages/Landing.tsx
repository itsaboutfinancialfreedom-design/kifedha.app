import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Sparkles, ArrowRight, Shield, Target, Wallet } from "lucide-react";
import { useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { hasCompletedOnboarding } = useApp();

  useEffect(() => {
    if (hasCompletedOnboarding) navigate("/dashboard");
  }, [hasCompletedOnboarding, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="gradient-gold px-6 pt-16 pb-12 rounded-b-[2rem] flex-shrink-0">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-4xl font-bold text-warning-foreground leading-tight">
            Akilifi
          </h1>
          <p className="text-warning-foreground/80 text-lg mt-2 font-display font-medium">
            Your AI Financial Advisor
          </p>
          <p className="text-warning-foreground/60 text-sm mt-3 leading-relaxed max-w-xs">
            Turn your income into structured, protected, and growing wealth. Built for Kenya.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {[
            {
              icon: Sparkles,
              title: "Financial Blueprint",
              desc: "AI tells you exactly what to do with your money — allocation, savings, investments.",
            },
            {
              icon: Target,
              title: "Goal Planning",
              desc: "School fees, emergency fund, retirement — track it all with clear timelines.",
            },
            {
              icon: Shield,
              title: "Risk & Protection",
              desc: "Know your financial risks and get insurance recommendations.",
            },
            {
              icon: Wallet,
              title: "Smart Budgeting",
              desc: "Auto-split income, goal-based wallets, and expense tracking.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/onboarding")}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-gold text-warning-foreground font-display font-bold text-base mt-8 shadow-elevated transition-transform active:scale-[0.98]"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Free to use. No bank connection needed.
        </p>
      </div>
    </div>
  );
}
