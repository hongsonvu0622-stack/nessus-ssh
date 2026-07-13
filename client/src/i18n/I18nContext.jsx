import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('nexusssh_lang') || 'vi';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('nexusssh_lang', newLang);
  };

  // Helper function t('sidebar.connections')
  const t = (path) => {
    const keys = path.split('.');
    let current = translations[lang] || translations.vi;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return path; // Fallback to key path if not found
      }
    }
    return current;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
