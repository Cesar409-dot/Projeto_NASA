"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { translateSiteText, type SiteLanguage } from "@/lib/site-language";

const STORAGE_KEY = "mars-survival-guide-language";
let fallbackLanguage: SiteLanguage = "pt-BR";
const languageListeners = new Set<() => void>();

type SiteLanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
  t: (value: string) => string;
};

const LanguageContext = createContext<SiteLanguageContextValue | null>(null);
const defaultLanguageContext: SiteLanguageContextValue = {
  language: "pt-BR",
  setLanguage: () => {},
  t: (value) => translateSiteText(value, "pt-BR"),
};

function readStoredLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "pt-BR";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en") return "en";
    if (saved === "pt" || saved === "pt-BR") return "pt-BR";
  } catch {
    // Use the in-memory default when browser storage is unavailable.
  }
  return fallbackLanguage;
}

function readServerLanguage(): SiteLanguage {
  return "pt-BR";
}

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    fallbackLanguage = event.newValue === "en" ? "en" : "pt-BR";
    listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveLanguage(nextLanguage: SiteLanguage) {
  fallbackLanguage = nextLanguage;
  try {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  } catch {
    // The in-memory language switch remains usable when storage is disabled.
  }
  languageListeners.forEach((listener) => listener());
}

function titleForPath(pathname: string) {
  if (pathname.startsWith("/mars-maps/library/")) return "Detalhes da Exploração | Mars Survival Guide";
  if (pathname === "/mars-maps/library") return "Biblioteca de Explorações | Mars Survival Guide";
  if (pathname.startsWith("/mars-greenhouse")) return "Mars Greenhouse | Cultivo em Marte";
  if (pathname.startsWith("/mars-maps")) return "Mars Maps | Mars Survival Guide";
  if (pathname.startsWith("/mind-space")) return "Mind Space | Mars Survival Guide";
  return "Mars Survival Guide — A próxima fronteira";
}

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  // React uses the same Portuguese server snapshot during hydration, then reads
  // the saved browser preference from this external store.
  const language = useSyncExternalStore(subscribeToLanguage, readStoredLanguage, readServerLanguage);
  const pathname = usePathname();

  const setLanguage = useCallback((nextLanguage: SiteLanguage) => saveLanguage(nextLanguage), []);

  const t = useCallback((value: string) => translateSiteText(value, language), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translateSiteText(titleForPath(pathname), language);
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = translateSiteText(
        "Explore Marte, os fatores humanos e o futuro do cultivo espacial em um atlas educativo interativo.",
        language,
      );
    }
  }, [language, pathname]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useSiteLanguage must be used inside SiteLanguageProvider");
  return context;
}

export function useOptionalSiteLanguage() {
  return useContext(LanguageContext) ?? defaultLanguageContext;
}
