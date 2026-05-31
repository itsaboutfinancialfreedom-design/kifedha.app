import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MpesaSetup() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const isValid = /^(?:\+?254|0)?7\d{8}$/.test(phone.replace(/\s+/g, ""));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <h1 className="font-display font-bold text-lg">M-Pesa Setup</h1>
          <span />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Connect M-Pesa</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Auto-import transactions and track spending</p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" /> Coming soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Safaricom phone number</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {phone && !isValid && (
                <p className="text-xs text-destructive">Enter a valid Kenyan Safaricom number</p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => {
                navigate('/tracker?sms=open');
              }}
            >
              Paste M-Pesa SMS
            </Button>

            <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">M-Pesa SMS logging (available now)</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Paste any M-Pesa confirmation SMS to log a transaction instantly</li>
                <li>We automatically extract amount, payee, and category</li>
                <li>No manual typing needed — works for Send Money, Paybill, and Till numbers</li>
              </ul>
            </div>
            <p className="text-[11px] text-muted-foreground">Auto-import coming in Phase 2</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
