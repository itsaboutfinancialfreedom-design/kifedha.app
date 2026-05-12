import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useT } from "@/hooks/useT";

export function OfflineBadge() {
  const { t } = useT();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (online) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-foreground/20 text-warning-foreground">
      <WifiOff className="w-3 h-3" /> {t("offline")}
    </span>
  );
}
