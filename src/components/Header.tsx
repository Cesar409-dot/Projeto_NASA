"use client";
import { LocalizedTree } from "@/components/LocalizedTree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Orbit, ArrowUpRight } from "lucide-react";
import { useSiteLanguage } from "./SiteLanguageProvider";
export function Header() {
  const path = usePathname();
  const isMarsMapsSection = path.startsWith("/mars-maps");
  const { language, setLanguage } = useSiteLanguage();
  return <LocalizedTree>{(
    <header className="header">
      <Link
        href="/"
        className="brand"
        aria-label="Mars Survival Guide — início"
      >
        <Orbit size={31} />
        <span>
          MARS<span>SURVIVAL GUIDE</span>
        </span>
      </Link>
      <nav aria-label="Navegação principal">
        {[
          ["/mars-maps", "Mars Maps"],
          ["/mind-space", "Mind Space"],
          ["/mars-greenhouse", "Mars Greenhouse"],
        ].map(([url, name]) => (
          <Link
            key={url}
            href={url}
            aria-current={path === url || (url === "/mars-maps" && isMarsMapsSection) ? "page" : undefined}
          >
            {name}
          </Link>
        ))}
      </nav>
      <div className="headerActions">
        <Link className="headerLink" href="/mars-maps">
          Iniciar exploração <ArrowUpRight size={16} />
        </Link>
        <div className="siteLanguageSwitch" role="group" aria-label="Idioma do site">
          <button type="button" lang="pt-BR" aria-pressed={language === "pt-BR"} data-active={language === "pt-BR"} data-language-ignore onClick={() => setLanguage("pt-BR")}>PT</button>
          <button type="button" lang="en" aria-pressed={language === "en"} data-active={language === "en"} data-language-ignore onClick={() => setLanguage("en")}>EN</button>
        </div>
      </div>
    </header>
  )}</LocalizedTree>;
}
