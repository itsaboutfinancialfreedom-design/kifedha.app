import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useTransactions } from "@/context/TransactionsContext";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBadge } from "@/components/OfflineBadge";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, Sparkles, Mic, Loader2, MessageSquareText, Languages } from "lucide-react";
import { CATEGORIES, Category, autoCategorize } from "@/lib/categorize";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const QUICK_EXPENSE_CATS: Category[] = ["Food", "Transport", "Bills", "Airtime & Data", "Shopping", "Health"];

export default function Tracker() {
  const navigate = useNavigate();
  const { t, lang, toggle } = useT();
  const { financials } = useApp();
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [open, setOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsBusy, setSmsBusy] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [autoCat, setAutoCat] = useState(true);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function parseSMS() {
    const text = smsText.trim();
    if (!text) { toast.error("Paste an M-Pesa SMS first"); return; }
    setSmsBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-transaction", { body: { text } });
      if (error) throw error;
      if (!data || !data.amount) { toast.error("Couldn't extract a transaction from that SMS"); return; }
      addTransaction({
        type: data.type,
        amount: Number(data.amount),
        note: data.note,
        category: data.category as Category,
        date: new Date().toISOString(),
        source: "mpesa",
      });
      toast.success(`Logged: ${data.note} · KES ${Number(data.amount).toLocaleString()}`);
      setSmsText("");
      setSmsOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "SMS parsing failed");
    } finally {
      setSmsBusy(false);
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording not supported on this device");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const mime = mr.mimeType || "audio/webm";
        await processAudio(new Blob(chunksRef.current, { type: mime }), mime);
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Microphone permission denied");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function processAudio(blob: Blob, mimeType: string) {
    setProcessing(true);
    try {
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
      }
      const b64 = btoa(binary);
      const { data, error } = await supabase.functions.invoke("parse-transaction", {
        body: { audio: b64, mimeType },
      });
      if (error) throw error;
      if (!data || !data.amount) {
        toast.error("Couldn't catch an amount. Try: 'Lunch at Naivas 350'");
        return;
      }
      addTransaction({
        type: data.type,
        amount: Number(data.amount),
        note: data.note,
        category: data.category as Category,
        date: new Date().toISOString(),
        source: "voice",
      });
      toast.success(`Logged: ${data.note} · KES ${Number(data.amount).toLocaleString()}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Voice parsing failed");
    } finally {
      setProcessing(false);
    }
  }

  const monthIncome = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === "income" && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const monthExpenses = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === "expense" && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const baseIncome = financials?.monthlyIncome ?? 0;
  const effectiveIncome = Math.max(baseIncome, monthIncome);
  const balance = effectiveIncome - monthExpenses;

  // Safe to spend today: remaining balance / days left in month, minus a 10% buffer
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const safeToday = Math.max(0, Math.floor((balance * 0.9) / daysLeft));

  const recent = transactions.slice(0, 5);

  function quickAdd(cat: Category) {
    setType("expense");
    setCategory(cat);
    setAutoCat(false);
    setNote(cat);
    setAmount("");
    setOpen(true);
  }

  function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addTransaction({
      type,
      amount: amt,
      note: note.trim() || category,
      date: new Date().toISOString(),
      category: autoCat ? autoCategorize(note) : category,
      source: "manual",
    });
    toast.success(`${type === "income" ? "Income" : "Expense"} logged`);
    setOpen(false);
    setAmount("");
    setNote("");
    setCategory("Other");
    setAutoCat(true);
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="gradient-gold px-4 pt-8 pb-10 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-warning-foreground/70 text-sm font-medium">{t("greeting")} 👋</p>
              <h1 className="font-display text-2xl font-bold text-warning-foreground mt-1">{t("tracker")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <OfflineBadge />
              <button
                onClick={toggle}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-warning-foreground/15 text-warning-foreground"
                aria-label="Toggle language"
              >
                <Languages className="w-3 h-3" /> {lang.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="mt-5 bg-warning-foreground/10 rounded-2xl p-4">
            <p className="text-warning-foreground/70 text-xs">{t("balance_month")}</p>
            <p className="font-display text-3xl font-bold text-warning-foreground mt-1">
              KES {balance.toLocaleString()}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning-foreground" />
              <p className="text-warning-foreground text-sm">
                {t("safe_today")}: <span className="font-bold">KES {safeToday.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Quick add chips */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h2 className="font-display text-sm font-semibold">{t("quick_log")}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setSmsOpen(true)}
                aria-label="Paste M-Pesa SMS"
              >
                <MessageSquareText className="w-4 h-4 mr-1" /> SMS
              </Button>
              <Button
                size="sm"
                variant={recording ? "destructive" : "outline"}
                className="rounded-full"
                onClick={recording ? stopRecording : startRecording}
                disabled={processing}
                aria-label={recording ? "Stop recording" : "Voice log"}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mic className={`w-4 h-4 ${recording ? "animate-pulse" : ""}`} />
                )}
                {recording ? t("stop") : processing ? "…" : t("voice")}
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full">
                    <Plus className="w-4 h-4 mr-1" /> {t("add")}
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log a transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={type === "expense" ? "default" : "outline"}
                      onClick={() => setType("expense")}
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-1" /> Expense
                    </Button>
                    <Button
                      variant={type === "income" ? "default" : "outline"}
                      onClick={() => setType("income")}
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-1" /> Income
                    </Button>
                  </div>
                  <div>
                    <Label>Amount (KES)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Input
                      value={note}
                      onChange={e => {
                        setNote(e.target.value);
                        if (autoCat) setCategory(autoCategorize(e.target.value));
                      }}
                      placeholder="e.g. Lunch at Naivas"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Category {autoCat && <span className="text-xs text-muted-foreground">(auto)</span>}</Label>
                      <button
                        type="button"
                        onClick={() => setAutoCat(!autoCat)}
                        className="text-xs text-primary"
                      >
                        {autoCat ? "Pick manually" : "Auto-detect"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {CATEGORIES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCategory(c); setAutoCat(false); }}
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            category === c
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={submit}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("paste_sms")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Textarea
                    rows={5}
                    value={smsText}
                    onChange={e => setSmsText(e.target.value)}
                    placeholder="e.g. QHJ4X8K2 Confirmed. Ksh500.00 sent to NAIVAS SUPERMARKET on 12/5/26 at 1:35PM. New M-PESA balance is Ksh 2,300.00..."
                  />
                  <Button className="w-full" onClick={parseSMS} disabled={smsBusy}>
                    {smsBusy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Parsing…</> : "Extract & log"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_EXPENSE_CATS.map(c => (
              <button
                key={c}
                onClick={() => quickAdd(c)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 border border-border"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>

        {/* Month summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{t("income_month")}</p>
            <p className="font-display font-bold text-success">KES {monthIncome.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{t("spent_month")}</p>
            <p className="font-display font-bold text-danger">KES {monthExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold mb-3">{t("recent_tx")}</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("no_tx")}</p>
          ) : (
            <div className="space-y-2">
              {recent.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === "income" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}>
                    {tx.type === "income" ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.note}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {tx.category} · {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${tx.type === "income" ? "text-success" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "-"}KES {tx.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    aria-label="Delete"
                    className="p-1 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/reports")}
          className="w-full bg-card rounded-2xl p-4 shadow-card text-sm font-medium text-left border border-border"
        >
          {t("view_reports")}
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-card rounded-2xl p-4 shadow-card text-sm font-medium text-left border border-border"
        >
          {t("view_wealth")}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
