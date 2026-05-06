export const CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Rent",
  "Shopping",
  "Health",
  "Entertainment",
  "Airtime & Data",
  "Business",
  "Family",
  "Savings",
  "Income",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

const RULES: { keywords: string[]; category: Category }[] = [
  { keywords: ["uber", "bolt", "matatu", "fare", "fuel", "petrol", "boda", "transport", "sgr"], category: "Transport" },
  { keywords: ["naivas", "carrefour", "quickmart", "food", "lunch", "dinner", "breakfast", "groceries", "supermarket", "mama mboga"], category: "Food" },
  { keywords: ["kplc", "water", "electricity", "wifi", "internet", "zuku", "faiba", "dstv", "gotv", "bill"], category: "Bills" },
  { keywords: ["rent", "landlord", "house"], category: "Rent" },
  { keywords: ["safaricom", "airtel", "telkom", "airtime", "bundles", "data"], category: "Airtime & Data" },
  { keywords: ["hospital", "clinic", "pharmacy", "chemist", "medicine", "nhif", "sha"], category: "Health" },
  { keywords: ["netflix", "showmax", "spotify", "movie", "club", "bar"], category: "Entertainment" },
  { keywords: ["shop", "jumia", "kilimall", "clothes", "shoes"], category: "Shopping" },
  { keywords: ["business", "stock", "supplier", "inventory"], category: "Business" },
  { keywords: ["mum", "dad", "family", "school fees", "fees", "shule"], category: "Family" },
  { keywords: ["sacco", "mmf", "money market", "save", "savings", "chama"], category: "Savings" },
  { keywords: ["salary", "payroll", "income", "paid", "received"], category: "Income" },
];

export function autoCategorize(text: string): Category {
  const t = text.toLowerCase();
  for (const r of RULES) {
    if (r.keywords.some(k => t.includes(k))) return r.category;
  }
  return "Other";
}
