"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Orbit, ArrowUpRight } from "lucide-react";
export function Header() {
  const path = usePathname();
  const isMarsMapsSection = path.startsWith("/mars-maps");
  return (
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
      <Link className="headerLink" href="/mars-maps">
        Iniciar exploração <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
