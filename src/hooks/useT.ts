import { useEffect, useState } from "react";
import { getLang, setLang as setLangRaw, t as tRaw, Lang } from "@/lib/i18n";

export function useT() {
  const [lang, setLangState] = useState<Lang>(getLang());
  useEffect(() => {
    const onChange = () => setLangState(getLang());
    window.addEventListener("ywb_lang_change", onChange);
    return () => window.removeEventListener("ywb_lang_change", onChange);
  }, []);
  return {
    lang,
    t: (k: Parameters<typeof tRaw>[0]) => tRaw(k, lang),
    setLang: (l: Lang) => setLangRaw(l),
    toggle: () => setLangRaw(lang === "en" ? "sw" : "en"),
  };
}
