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
  // ── NEW: Kenyan loan apps and mobile credit ─────────────────
  {
    keywords: [
      "tala", "branch", "fuliza", "m-shwari", "mshwari",
      "kcb mpesa", "kcb m-pesa", "timiza", "zenka", "okolea",
      "loan", "repayment", "repay", "credit",
    ],
    category: "Bills",
  },

  // ── NEW: Kenyan banks ────────────────────────────────────────
  {
    keywords: [
      "equity bank", "equity agent", "kcb", "co-op", "coop bank",
      "cooperative bank", "ncba", "stanbic", "barclays", "absa",
      "i&m", "dtb", "diamond trust", "family bank", "bank",
      "atm", "withdrawal", "deposit",
    ],
    category: "Savings",
  },

  // ── NEW: M-Pesa person-to-person transfers ───────────────────
  {
    keywords: [
      "you have sent", "you sent", "received from", "paid to",
      "transferred to", "send money", "m-pesa", "mpesa",
      "lipa na", "paybill", "buy goods", "till",
    ],
    category: "Bills",
  },

  // ── NEW: Kenyan supermarkets and food ──────────────────────
  {
    keywords: [
      "chandarana", "cleanshelf", "ukwala", "tuskys",
      "java", "kfc", "chicken inn", "pizza inn", "galitos",
      "artcaffe", "dormans",
    ],
    category: "Food",
  },

  // ── NEW: Government and tax ─────────────────────────────────
  {
    keywords: [
      "kra", "ntsa", "nssf", "nhif", "sha", "county", "huduma",
      "ecitizen", "government", "tax",
    ],
    category: "Bills",
  },

  // ── NEW: Kenyan ride and delivery ───────────────────────────
  {
    keywords: [
      "little cab", "littlecab", "indriver", "faras",
      "glovo", "jumia food", "sendy",
    ],
    category: "Transport",
  },

  // ── EXISTING rules unchanged below ─────────────────────────
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
