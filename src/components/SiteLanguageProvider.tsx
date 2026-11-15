"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { translateSiteText, type SiteLanguage } from "@/lib/site-language";

const STORAGE_KEY = "mars-survival-guide-language";
const LanguageContext = createContext<{ language: SiteLanguage; setLanguage: (language: SiteLanguage) => void } | null>(null);
const translatedAttributes = ["aria-label", "aria-valuetext", "aria-description", "placeholder", "title", "alt", "content"] as const;
const ignoredTextElements = "script, style, noscript, textarea, code, pre, [data-language-ignore]";
type TranslationState = { source: string; rendered: string };
const textState = new WeakMap<Text, TranslationState>();
const attributeState = new WeakMap<Element, Map<string, TranslationState>>();

function translateElement(element: Element, language: SiteLanguage) {
  if (element.closest("[data-language-ignore]")) return;
  let states = attributeState.get(element);
  if (!states) {
    states = new Map();
    attributeState.set(element, states);
  }
  for (const name of translatedAttributes) {
    const value = element.getAttribute(name);
    if (value === null) continue;
    let state = states.get(name);
    if (!state || value !== state.rendered) state = { source: value, rendered: value };
    const translated = translateSiteText(state.source, language);
    state.rendered = translated;
    states.set(name, state);
    if (translated !== value) element.setAttribute(name, translated);
  }
}

function translateTextNode(node: Text, language: SiteLanguage) {
  const parent = node.parentElement;
  if (!parent || parent.closest(ignoredTextElements)) return;
  let state = textState.get(node);
  if (!state || node.data !== state.rendered) state = { source: node.data, rendered: node.data };
  const translated = translateSiteText(state.source, language);
  state.rendered = translated;
  textState.set(node, state);
  if (translated !== node.data) node.data = translated;
}

function translatePage(language: SiteLanguage) {
  document.documentElement.lang = language === "en" ? "en" : "pt-BR";
  const root = document.documentElement;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node as Text, language);
    node = walker.nextNode();
  }
  root.querySelectorAll("[aria-label], [aria-valuetext], [aria-description], [placeholder], [title], [alt]").forEach((element) => translateElement(element, language));
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) translateElement(description, language);
}

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageValue] = useState<SiteLanguage>("pt");
  const pathname = usePathname();

  const setLanguage = useCallback((nextLanguage: SiteLanguage) => {
    setLanguageValue(nextLanguage);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Keep the language switch available when browser storage is disabled.
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "pt") setLanguageValue(saved);
    } catch {
      // Portuguese is the default when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    translatePage(language);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          translateTextNode(record.target as Text, language);
        } else if (record.type === "attributes") {
          translateElement(record.target as Element, language);
        } else {
          record.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) translateTextNode(added as Text, language);
            else if (added instanceof Element) {
              if (added.matches("[aria-label], [aria-valuetext], [aria-description], [placeholder], [title], [alt]")) translateElement(added, language);
              const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
              let node = walker.nextNode();
              while (node) {
                translateTextNode(node as Text, language);
                node = walker.nextNode();
              }
              added.querySelectorAll("[aria-label], [aria-valuetext], [aria-description], [placeholder], [title], [alt]").forEach((element) => translateElement(element, language));
            }
          });
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatedAttributes],
    });
    return () => observer.disconnect();
  }, [language, pathname]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useSiteLanguage must be used inside SiteLanguageProvider");
  return context;
}
