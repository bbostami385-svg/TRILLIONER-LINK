import { useState, useEffect } from "react";
import { t, setLanguage, getLanguage, getAvailableLanguages, formatDate, formatNumber, formatCurrency } from "../lib/i18n";

export function useTranslation() {
  const [language, setLanguageState] = useState(getLanguage());

  useEffect(() => {
    const handleLanguageChange = (event: any) => {
      setLanguageState(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange);
    return () => window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang as any);
    setLanguageState(lang as any);
  };

  return {
    t,
    language,
    changeLanguage,
    availableLanguages: getAvailableLanguages(),
    formatDate,
    formatNumber,
    formatCurrency,
  };
}
