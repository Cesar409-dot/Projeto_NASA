"use client";

import { cloneElement, isValidElement, type ReactNode } from "react";
import { translateSiteText } from "@/lib/site-language";
import { useOptionalSiteLanguage } from "./SiteLanguageProvider";

const translatedAttributes = [
  "aria-label",
  "aria-valuetext",
  "aria-description",
  "placeholder",
  "title",
  "alt",
] as const;

const untranslatedElements = new Set(["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA"]);

function localizeNode(node: ReactNode, language: "pt-BR" | "en", ignored = false): ReactNode {
  if (ignored || node == null || typeof node === "boolean" || typeof node === "number" || typeof node === "bigint") {
    return node;
  }
  if (language === "pt-BR") return node;

  if (typeof node === "string") return translateSiteText(node, language);
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const localized = localizeNode(child, language);
      return isValidElement(localized) && localized.key === null
        ? cloneElement(localized, { key: `localized-${index}` })
        : localized;
    });
  }

  if (!isValidElement<Record<string, unknown>>(node)) return node;

  const props = node.props;
  const tag = typeof node.type === "string" ? node.type.toUpperCase() : "";
  if (props["data-language-ignore"] !== undefined) return node;

  const nextProps: Record<string, unknown> = { ...props };
  for (const name of translatedAttributes) {
    const value = props[name];
    if (typeof value === "string") nextProps[name] = translateSiteText(value, language);
  }

  if ("children" in props) {
    nextProps.children = localizeNode(props.children as ReactNode, language, untranslatedElements.has(tag));
  }

  return cloneElement(node, nextProps);
}

export function LocalizedTree({ children }: { children: ReactNode }) {
  const { language } = useOptionalSiteLanguage();
  return localizeNode(children, language);
}
