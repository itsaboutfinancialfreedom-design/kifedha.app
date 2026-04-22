import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Sparkles, ArrowRight, Shield, Target, Wallet, TrendingDown, TrendingUp, Briefcase } from "lucide-react";
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
            Kifedha
          </h1>
          <p className="text-warning-foreground/80 text-lg mt-2 font-display font-medium">
            Smart Financial Planning
          </p>
          <p className="text-warning-foreground/60 text-sm mt-3 leading-relaxed max-w-xs">
            Track income, manage expenses, allocate to goals, and build wealth — all in one place.
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
              desc: "Get a personalized income allocation plan — needs, savings, investments, and protection.",
            },
            {
              icon: Shield,
              title: "Three Smart Dashboards",
              desc: "See your financial literacy, wealth planning readiness, and insurance coverage gaps at a glance.",
            },
            {
              icon: Wallet,
              title: "Track Income & Expenses",
              desc: "See where your money goes and auto-split income using smart budgeting rules.",
            },
            {
              icon: Target,
              title: "Goal-Based Allocation",
              desc: "School fees, emergency fund, retirement — allocate and track with clear timelines.",
            },
            {
              icon: TrendingUp,
              title: "Investment Allocation",
              desc: "Know exactly how much to invest and where, based on your income and goals.",
            },
            {
              icon: TrendingDown,
              title: "Debt Payoff Strategy",
              desc: "See your debt levels, interest costs, and get a clear payoff plan.",
            },
            {
              icon: Briefcase,
              title: "Income Protection & Replacement",
              desc: "Life cover, health insurance, and income protection recommendations.",
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
