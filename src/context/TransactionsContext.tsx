import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  addTransaction: (t: Omit<Transaction, "id" | "category"> & { category?: Category }) => Transaction;
  deleteTransaction: (id: string) => void;
  clearAll: () => void;
}

const TxContext = createContext<Ctx | null>(null);
const KEY = "ywb_transactions";

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction: Ctx["addTransaction"] = (t) => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: t.type,
      amount: t.amount,
      note: t.note,
      date: t.date,
      source: t.source ?? "manual",
      category: t.category ?? autoCategorize(t.note),
    };
    setTransactions(prev => [tx, ...prev]);
    return tx;
  };

  const deleteTransaction = (id: string) =>
    setTransactions(prev => prev.filter(t => t.id !== id));

  const clearAll = () => setTransactions([]);

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
