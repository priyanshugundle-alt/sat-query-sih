import React, { createContext, useContext, useState } from "react";
import { INDIAN_LANGUAGES, DEFAULT_LANGUAGE } from "../constants/languages";

const LanguageContext = createContext({
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  languages: INDIAN_LANGUAGES,
});

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_language_id");
      if (saved) {
        const found = INDIAN_LANGUAGES.find((l) => l.id === saved || l.code === saved);
        if (found) return found;
      }
    } catch (e) {
      console.warn("Could not read language from localStorage", e);
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (langOrId) => {
    let target = langOrId;
    if (typeof langOrId === "string") {
      target = INDIAN_LANGUAGES.find((l) => l.id === langOrId || l.code === langOrId) || DEFAULT_LANGUAGE;
    }
    if (target) {
      setCurrentLanguageState(target);
      try {
        localStorage.setItem("satquery_language_id", target.id);
      } catch (e) {
        console.warn("Could not save language to localStorage", e);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, languages: INDIAN_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
