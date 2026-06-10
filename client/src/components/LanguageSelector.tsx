import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";
import "./LanguageSelector.css";

type Language = "en" | "bn" | "hi";

export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage } = useTranslation();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  ];

  return (
    <div className="language-selector">
      <div className="language-dropdown">
        <button className="language-toggle">
          <Globe size={20} />
          <span>{language.toUpperCase()}</span>
        </button>
        <div className="language-menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${language === lang.code ? "active" : ""}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="flag">{lang.flag}</span>
              <span className="name">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
