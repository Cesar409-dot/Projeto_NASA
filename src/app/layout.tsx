import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteLanguageProvider } from "@/components/SiteLanguageProvider";
export const metadata: Metadata = {
  title: {
    default: "Mars Survival Guide — A próxima fronteira",
    template: "%s | Mars Survival Guide",
  },
  description:
    "Explore Marte, os fatores humanos e o futuro do cultivo espacial em um atlas educativo interativo.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteLanguageProvider>
          <a className="skip" href="#main">
            Pular para o conteúdo
          </a>
          <Header />
          {children}
          <footer>
            <span>
              MARS SURVIVAL GUIDE <i> / </i> EXPLORAR É HUMANO.
            </span>
            <span>Protótipo educativo independente · Sem endosso da NASA</span>
          </footer>
        </SiteLanguageProvider>
      </body>
    </html>
  );
}
