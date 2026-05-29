import { useState } from "react";
import { FileDown, Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateFinancialReport } from "@/utils/pdfGenerator";

interface Props {
  variant?: "default" | "compact";
  className?: string;
}

export function ExportPDF({ variant = "default", className = "" }: Props) {
  const navigate = useNavigate();
  const { isPremium } = useApp();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!isPremium) {
      toast.error("PDF export is a Premium feature");
      navigate("/advisor/upgrade");
      return;
    }
    if (!user) { navigate("/auth"); return; }
    setLoading(true);
    try {
      await generateFinancialReport({
        userId: user.id,
        userName: profile?.full_name ?? null,
        userEmail: user.email ?? null,
      });
      toast.success("Your financial report has been downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate PDF");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className={className}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isPremium ? <FileDown className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
        {isPremium ? "Download PDF" : "PDF (Premium)"}
      </Button>
    );
  }

  return (
    <Button onClick={handleExport} disabled={loading} className={`gradient-premium text-premium-foreground ${className}`}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isPremium ? <FileDown className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
      {isPremium ? "Download Financial Report (PDF)" : "Unlock PDF reports — Premium"}
    </Button>
  );
}
