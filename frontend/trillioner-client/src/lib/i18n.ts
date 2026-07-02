import enTranslations from "../locales/en.json";
import bnTranslations from "../locales/bn.json";
import hiTranslations from "../locales/hi.json";

type Language = "en" | "bn" | "hi";

const translations: Record<Language, typeof enTranslations> = {
  en: enTranslations,
  bn: bnTranslations,
  hi: hiTranslations,
};

let currentLanguage: Language = "en";

// Load language from localStorage
export function initializeLanguage() {
  const saved = localStorage.getItem("language") as Language | null;
  if (saved && saved in translations) {
    currentLanguage = saved;
  } else {
    // Detect browser language
    const browserLang = navigator.language.split("-")[0] as Language;
    if (browserLang in translations) {
      currentLanguage = browserLang;
    }
  }
  document.documentElement.lang = currentLanguage;
  return currentLanguage;
}

export function setLanguage(lang: Language) {
  if (lang in translations) {
    currentLanguage = lang;
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    // Trigger re-render by dispatching custom event
    window.dispatchEvent(new CustomEvent("languageChange", { detail: { language: lang } }));
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function getAvailableLanguages() {
  return [
    { code: "en", name: "English" },
    { code: "bn", name: "বাংলা" },
    { code: "hi", name: "हिन्दी" },
  ];
}

// Deep get nested translation keys
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((current, prop) => current?.[prop], obj);
}

export function t(key: string, defaultValue?: string): string {
  const value = getNestedValue(translations[currentLanguage], key);
  if (value) return value;

  // Fallback to English
  const fallback = getNestedValue(translations.en, key);
  if (fallback) return fallback;

  return defaultValue || key;
}

// Format date based on language
export function formatDate(date: Date, lang?: Language): string {
  const language = lang || currentLanguage;
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : language === "hi" ? "hi-IN" : "en-US", options).format(date);
}

// Format number based on language
export function formatNumber(num: number, lang?: Language): string {
  const language = lang || currentLanguage;
  return new Intl.NumberFormat(language === "bn" ? "bn-BD" : language === "hi" ? "hi-IN" : "en-US").format(num);
}

// Format currency
export function formatCurrency(amount: number, currency: string = "BDT", lang?: Language): string {
  const language = lang || currentLanguage;
  return new Intl.NumberFormat(language === "bn" ? "bn-BD" : language === "hi" ? "hi-IN" : "en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}
