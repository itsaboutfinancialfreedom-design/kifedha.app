export type Lang = "en" | "sw";

const DICT: Record<string, { en: string; sw: string }> = {
  greeting: { en: "Hello", sw: "Habari" },
  tracker: { en: "Kifedha Tracker", sw: "Kifedha Tracker" },
  balance_month: { en: "Current balance this month", sw: "Salio la mwezi huu" },
  safe_today: { en: "Safe to spend today", sw: "Salama kutumia leo" },
  quick_log: { en: "Quick log", sw: "Andika haraka" },
  add: { en: "Add", sw: "Ongeza" },
  voice: { en: "Voice", sw: "Sauti" },
  stop: { en: "Stop", sw: "Simama" },
  paste_sms: { en: "Paste M-Pesa SMS", sw: "Bandika SMS ya M-Pesa" },
  income_month: { en: "Income (this month)", sw: "Mapato (mwezi huu)" },
  spent_month: { en: "Spent (this month)", sw: "Matumizi (mwezi huu)" },
  recent_tx: { en: "Recent transactions", sw: "Miamala ya hivi karibuni" },
  no_tx: { en: "No transactions yet. Tap Add to log your first one.", sw: "Hakuna miamala bado. Bonyeza Ongeza ili kuanza." },
  view_wealth: { en: "View Wealth Blueprint →", sw: "Tazama Mpango wa Utajiri →" },
  view_reports: { en: "View Reports & Export →", sw: "Tazama Ripoti & Hamisha →" },
  reports: { en: "Reports", sw: "Ripoti" },
  month_over_month: { en: "Month over month", sw: "Mwezi kwa mwezi" },
  by_category: { en: "Spending by category", sw: "Matumizi kwa aina" },
  suggested_budgets: { en: "Suggested budgets (avg of last 3 months)", sw: "Mapendekezo ya bajeti (wastani wa miezi 3 iliyopita)" },
  export_csv: { en: "Export CSV", sw: "Hamisha CSV" },
  export_pdf: { en: "Print / Save PDF", sw: "Chapisha / Hifadhi PDF" },
  offline: { en: "Offline", sw: "Nje ya mtandao" },
};

export function t(key: keyof typeof DICT, lang: Lang) {
  return DICT[key]?.[lang] ?? key;
}

export function getLang(): Lang {
  return (localStorage.getItem("ywb_lang") as Lang) || "en";
}

export function setLang(l: Lang) {
  localStorage.setItem("ywb_lang", l);
  window.dispatchEvent(new Event("ywb_lang_change"));
}
