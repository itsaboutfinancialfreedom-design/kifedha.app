interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  variant?: "health" | "risk";
}

export function ScoreRing({ score, size = 120, label, variant = "health" }: ScoreRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (variant === "risk") {
      if (score > 70) return "hsl(var(--danger))";
      if (score > 40) return "hsl(var(--warning))";
      return "hsl(var(--success))";
    }
    if (score > 70) return "hsl(var(--success))";
    if (score > 40) return "hsl(var(--warning))";
    return "hsl(var(--danger))";
  };

  const getLabel = () => {
    if (variant === "risk") {
      if (score > 70) return "High Risk";
      if (score > 40) return "Medium";
      return "Low Risk";
    }
    if (score > 70) return "Healthy";
    if (score > 40) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="font-display text-2xl font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{getLabel()}</span>
      </div>
      {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
    </div>
  );
}
