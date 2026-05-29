import { Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  message?: string;
  className?: string;
}

export function UpgradeBanner({ message = "Unlock this with Premium", className = "" }: Props) {
  return (
    <Link
      to="/advisor/upgrade"
      className={`flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm hover:bg-warning/15 transition ${className}`}
    >
      <span className="flex items-center gap-2 font-semibold">
        <Crown className="w-4 h-4 text-warning" />
        {message}
      </span>
      <ArrowRight className="w-4 h-4 text-warning" />
    </Link>
  );
}
