import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Receipt, Target, LayoutDashboard, Sparkles, BookOpen } from "lucide-react";

const navItems = [
  { to: "/tracker",   icon: Receipt,        label: "Tracker"  },
  { to: "/dashboard", icon: LayoutDashboard, label: "Wealth"   },
  { to: "/goals",     icon: Target,          label: "Goals"    },
  { to: "/advisor",   icon: Sparkles,        label: "Advisor"  },
  { to: "/learn",     icon: BookOpen,        label: "Learn"    },
];

export function BottomNav() {
  const location = useLocation();
  const { isPremium } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          const showPro = to === "/advisor" && !active && !isPremium;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {showPro && (
                  <span className="absolute -top-1.5 -right-2.5 text-[8px] font-bold text-warning bg-warning/15 px-1 rounded">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
