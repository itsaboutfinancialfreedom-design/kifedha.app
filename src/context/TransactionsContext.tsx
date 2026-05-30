import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { autoCategorize, Category } from "@/lib/categorize";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: Category;
  note: string;
  date: string; // ISO
  source?: "manual" | "voice" | "mpesa";
}

interface Ctx {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id" | "category"> & { category?: Category }) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const TxContext = createContext<Ctx | null>(null);
const LEGACY_KEY = "ywb_transactions";

// Map a DB row to our Transaction shape
function rowToTx(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: (row.category ?? "Other") as Category,
    note: row.description ?? "",
    date: row.occurred_at,
    source: (row.source ?? "manual") as Transaction["source"],
  };
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from DB whenever the user changes; one-time migrate legacy local data.
  const refresh = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", uid)
      .order("occurred_at", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("[transactions] load failed", error);
      return;
    }
    setTransactions((data ?? []).map(rowToTx));
  }, []);

  // One-time migration of any localStorage transactions into the DB.
  const migrateLegacy = useCallback(async (uid: string) => {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const legacy: Transaction[] = JSON.parse(raw);
      if (!Array.isArray(legacy) || legacy.length === 0) {
        localStorage.removeItem(LEGACY_KEY);
        return;
      }
      const rows = legacy.map(t => ({
        user_id: uid,
        amount: t.amount,
        type: t.type,
        category: t.category ?? "Other",
        description: t.note ?? "",
        source: t.source ?? "manual",
        occurred_at: t.date ?? new Date().toISOString(),
      }));
      const { error } = await supabase.from("transactions").insert(rows);
      if (!error) localStorage.removeItem(LEGACY_KEY);
    } catch (e) {
      console.warn("[transactions] legacy migration skipped", e);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      await migrateLegacy(user.id);
      if (!cancelled) await refresh(user.id);
    })();

    const ch = supabase
      .channel(`tx-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => { refresh(user.id); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, refresh, migrateLegacy]);

  const addTransaction: Ctx["addTransaction"] = async (t) => {
    const category = (t.category ?? autoCategorize(t.note)) as Category;
    const optimistic: Transaction = {
      id: crypto.randomUUID(),
      type: t.type,
      amount: t.amount,
      note: t.note,
      date: t.date,
      source: t.source ?? "manual",
      category,
    };

    if (!user) {
      // No user — keep behaviour graceful: hold in memory only.
      setTransactions(prev => [optimistic, ...prev]);
      return optimistic;
    }

    setTransactions(prev => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: optimistic.amount,
        type: optimistic.type,
        category: optimistic.category,
        description: optimistic.note,
        source: optimistic.source,
        occurred_at: optimistic.date,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[transactions] insert failed", error);
      // Roll back optimistic row
      setTransactions(prev => prev.filter(x => x.id !== optimistic.id));
      throw error ?? new Error("Failed to save transaction");
    }

    const saved = rowToTx(data);
    setTransactions(prev => [saved, ...prev.filter(x => x.id !== optimistic.id)]);
    return saved;
  };

  const deleteTransaction: Ctx["deleteTransaction"] = async (id) => {
    const prev = transactions;
    setTransactions(p => p.filter(t => t.id !== id));
    if (!user) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      console.error("[transactions] delete failed", error);
      setTransactions(prev); // rollback
      throw error;
    }
  };

  const clearAll: Ctx["clearAll"] = async () => {
    const prev = transactions;
    setTransactions([]);
    if (!user) return;
    const { error } = await supabase.from("transactions").delete().eq("user_id", user.id);
    if (error) {
      console.error("[transactions] clearAll failed", error);
      setTransactions(prev);
      throw error;
    }
  };

  return (
    <TxContext.Provider value={{ transactions, addTransaction, deleteTransaction, clearAll }}>
      {children}
    </TxContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TxContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
