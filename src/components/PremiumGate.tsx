import { Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

interface PremiumGateProps {
  children: React.ReactNode;
  featureName: string;
}

export function PremiumGate({ children, featureName }: PremiumGateProps) {
  const { isPremium, premiumLoading } = useApp();
  const navigate = useNavigate();

  if (premiumLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your subscription…</p>
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative min-h-[60vh]">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
        <div className="text-center p-6 max-w-xs">
          <div className="w-16 h-16 rounded-full gradient-premium flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-premium-foreground" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Unlock {featureName}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Get full access to {featureName.toLowerCase()} and take control of your finances.
          </p>
          <button
            onClick={() => navigate("/advisor/upgrade")}
            className="w-full py-3 px-6 rounded-xl gradient-premium text-premium-foreground font-semibold text-sm shadow-elevated transition-transform active:scale-[0.98]"
          >
            Upgrade — KES 1,040/month
          </button>
          <p className="text-xs text-muted-foreground mt-3">7-day free trial included</p>
        </div>
      </div>
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}

