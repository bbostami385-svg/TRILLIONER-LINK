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

const englishTextKeys: Record<string, string> = {
  "Loading...": "common.loading",
  "An error occurred": "common.error",
  "Success": "common.success",
  "Cancel": "common.cancel",
  "Save": "common.save",
  "Delete": "common.delete",
  "Edit": "common.edit",
  "Logout": "common.logout",
  "Login": "common.login",
  "Sign In": "common.login",
  "Sign Up": "common.signup",
  "Settings": "common.settings",
  "Profile": "common.profile",
  "Try again": "common.retry",
  "Close": "common.close",
  "Most Popular": "common.popular",
  "Feed": "navigation.feed",
  "Explore": "navigation.explore",
  "Messages": "navigation.messages",
  "Videos": "navigation.videos",
  "Stories": "navigation.stories",
  "Notifications": "navigation.notifications",
  "Marketplace": "navigation.marketplace",
  "Creator Dashboard": "navigation.creatorDashboard",
  "Payment": "navigation.payment",
  "Like": "feed.like",
  "Comment": "feed.comment",
  "Share": "feed.share",
  "No posts yet": "feed.noPostsYet",
  "Choose Your Plan": "payment.choosePlan",
  "Subscribe Now": "payment.subscribeNow",
  "Processing...": "payment.processing",
  "Accepted Payment Methods": "payment.paymentMethods",
  "Frequently Asked Questions": "payment.faq",
  "Credit Card": "payment.creditCard",
  "Debit Card": "payment.debitCard",
  "Mobile Banking": "payment.mobileBanking",
  "Internet Banking": "payment.internetBanking",
  "Payment history": "profile.paymentHistory",
  "Followers": "profile.followers",
  "Subscribers": "profile.subscribers",
  "Following": "profile.following",
  "Posts": "profile.posts",
  "Saved": "profile.saved",
  "Message": "profile.message",
  "Human verified": "profile.humanVerified",
  "No videos yet": "profile.noVideos",
  "No saved posts yet": "profile.noSavedPosts"
};

const originalDocumentText = new WeakMap<Text, string>();

export function translateStaticText(text: string): string {
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  const core = text.slice(leading.length, text.length - trailing.length || undefined);
  const key = englishTextKeys[core];
  if (!key) return text;
  return `${leading}${t(key, core)}${trailing}`;
}

export function translateDocument(root: ParentNode = document.body): void {
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const parent = textNode.parentElement;
    if (parent && !parent.closest("script,style,textarea,input,[data-no-translate]")) {
      const original = originalDocumentText.get(textNode) ?? textNode.nodeValue ?? "";
      if (!originalDocumentText.has(textNode)) originalDocumentText.set(textNode, original);
      const translated = translateStaticText(original);
      if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
    }
    current = walker.nextNode();
  }
}

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
