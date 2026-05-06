import { Link, useLocation } from "react-router-dom";
import { Receipt, Target, LayoutDashboard, Shield, TrendingDown } from "lucide-react";

const navItems = [
  { to: "/tracker", icon: Receipt, label: "Tracker" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Wealth" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/protection", icon: Shield, label: "Protect" },
  { to: "/debt", icon: TrendingDown, label: "Debt" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
