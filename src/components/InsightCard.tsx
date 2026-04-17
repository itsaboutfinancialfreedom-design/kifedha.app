import { useState } from "react";
import { AlertTriangle, Info, CheckCircle2, AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import { Insight } from "@/lib/insightsEngine";

const sevStyles = {
  info: { icon: Info, text: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20" },
  warning: { icon: AlertCircle, text: "text-warning", bg: "bg-warning/10", ring: "ring-warning/20" },
  danger: { icon: AlertTriangle, text: "text-danger", bg: "bg-danger/10", ring: "ring-danger/20" },
  success: { icon: CheckCircle2, text: "text-success", bg: "bg-success/10", ring: "ring-success/20" },
};

export function InsightCard({ insight, onAction }: { insight: Insight; onAction?: () => void }) {
  const [showReason, setShowReason] = useState(false);
  const s = sevStyles[insight.severity];
  const Icon = s.icon;

  return (
    <div className={`rounded-2xl p-4 shadow-card bg-card border border-border`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${s.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm leading-tight">{insight.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.body}</p>

          <button
            onClick={() => setShowReason(v => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>Why this advice?</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showReason ? "rotate-180" : ""}`} />
          </button>

          {showReason && (
            <div className="mt-2 p-2.5 bg-muted/60 rounded-lg border border-border">
              <p className="text-[11px] text-foreground/80 leading-relaxed">{insight.reason}</p>
            </div>
          )}

          {insight.actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              {insight.actionLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
