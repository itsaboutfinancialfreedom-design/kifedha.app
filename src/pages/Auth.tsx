import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);
const nameSchema = z.string().trim().min(1, "Required").max(100);
// E.164: +<country><number>, 8-15 digits total
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format e.g. +254712345678");

type Mode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP state
  const [phone, setPhone] = useState("+254");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (profile && !profile.onboarding_completed) navigate("/onboarding", { replace: true });
    else navigate("/dashboard", { replace: true });
  }, [user, profile, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const emailOk = emailSchema.safeParse(email);
      const passOk = passwordSchema.safeParse(password);
      if (!emailOk.success) throw new Error(emailOk.error.issues[0].message);
      if (!passOk.success) throw new Error(passOk.error.issues[0].message);

      if (mode === "signup") {
        const nameOk = nameSchema.safeParse(fullName);
        if (!nameOk.success) throw new Error("Enter your full name");
        const { error } = await supabase.auth.signUp({
          email: emailOk.data,
          password: passOk.data,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { full_name: nameOk.data },
          },
        });
        if (error) throw error;
        toast.success("Check your inbox to verify your email");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailOk.data,
          password: passOk.data,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(String(result.error));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const phoneOk = phoneSchema.safeParse(phone);
      if (!phoneOk.success) throw new Error(phoneOk.error.issues[0].message);
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneOk.data,
        options: { channel: "sms" },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success("Code sent. Check your SMS.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send code";
      toast.error(/provider|disabled|sms/i.test(msg)
        ? "Phone sign-in isn't enabled yet. Please use email or Google for now."
        : msg);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const phoneOk = phoneSchema.safeParse(phone);
      if (!phoneOk.success) throw new Error(phoneOk.error.issues[0].message);
      if (otp.length !== 6) throw new Error("Enter the 6-digit code");
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneOk.data,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success("Signed in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-gold px-6 pt-12 pb-10 rounded-b-[2rem]">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-3xl font-bold text-warning-foreground">Kifedha</h1>
          <p className="text-warning-foreground/80 mt-1 text-sm">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <form onSubmit={handleEmail} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <div className="relative mt-1">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Wanjiku"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pl-9"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                🔒 Your data is encrypted and never shared with third parties.
              </p>

              <Button type="submit" disabled={busy} className="w-full h-11 font-display font-semibold">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full h-11 font-medium"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continue with Google
            </Button>
          </TabsContent>

          <TabsContent value="phone" className="mt-6">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                      placeholder="+254712345678"
                      className="pl-9"
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use international format. We'll text you a 6-digit code.
                  </p>
                </div>
                <Button type="submit" disabled={busy} className="w-full h-11 font-display font-semibold">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <Label>Enter 6-digit code sent to {phone}</Label>
                  <div className="mt-2 flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button type="submit" disabled={busy || otp.length !== 6} className="w-full h-11 font-display font-semibold">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & continue"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setOtpSent(false); setOtp(""); }}
                  disabled={busy}
                  className="w-full"
                >
                  Use a different number
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signup" ? "Already have an account?" : "New to Kifedha?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary font-semibold"
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}
