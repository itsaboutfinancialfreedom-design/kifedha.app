import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Mail, MessageSquare, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "@/components/BottomNav";

interface Pref {
  type: string;
  label: string;
  description: string;
  icon: typeof Bell;
  frequency?: string;
}

const PREFS: Pref[] = [
  { type: "email", label: "Email notifications", description: "Receive insights and alerts in your inbox.", icon: Mail },
  { type: "sms", label: "SMS notifications", description: "Get critical alerts on your phone (Africa's Talking).", icon: MessageSquare },
  { type: "weekly_digest", label: "Weekly digest", description: "Your net worth change and top wins each week.", icon: Calendar, frequency: "weekly" },
  { type: "monthly_review", label: "Monthly review", description: "Reminder to review your budget and goals.", icon: Calendar, frequency: "monthly" },
  { type: "payment_reminders", label: "Payment reminders", description: "Alert 3 days before each debt due date.", icon: CreditCard },
];

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("notification_type, enabled")
        .eq("user_id", user.id);
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((r: any) => { map[r.notification_type] = r.enabled; });
      setEnabled(map);
      setLoading(false);
    })();
  }, [user]);

  async function toggle(pref: Pref, value: boolean) {
    if (!user) return;
    setEnabled((prev) => ({ ...prev, [pref.type]: value }));
    const { error } = await supabase
      .from("user_notifications")
      .upsert(
        { user_id: user.id, notification_type: pref.type, enabled: value, frequency: pref.frequency ?? null },
        { onConflict: "user_id,notification_type" }
      );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setEnabled((prev) => ({ ...prev, [pref.type]: !value }));
    } else {
      toast({ title: value ? "Enabled" : "Disabled", description: pref.label });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-display font-bold text-base">Notifications</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Stay in the loop</CardTitle>
            <CardDescription>Choose how Kifedha keeps you on track. You can change these any time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              PREFS.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.type} className="flex items-start gap-3 py-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={p.type} className="text-sm font-medium">{p.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    </div>
                    <Switch
                      id={p.type}
                      checked={!!enabled[p.type]}
                      onCheckedChange={(v) => toggle(p, v)}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
