import { act, type ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/Header";
import { LocalizedTree } from "@/components/LocalizedTree";
import { MindSpace } from "@/components/MindSpace";
import { SiteLanguageProvider, useSiteLanguage } from "@/components/SiteLanguageProvider";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

function LanguageContent() {
  const { language, setLanguage, t } = useSiteLanguage();

  return (
    <LocalizedTree>
      <main aria-label="Navegação principal">
        <p>Iniciar exploração</p>
        <button type="button" onClick={() => setLanguage("en")}>Choose English</button>
        <button type="button" onClick={() => setLanguage("pt-BR")}>Choose Portuguese</button>
        <input aria-label="Site search" placeholder="Buscar cultura" value="soil" onChange={() => {}} />
        <p data-language-ignore>Uma anotação pessoal: água, pressão e rotina.</p>
        <output>{language}</output>
        <span>{t("O terreno é só o começo.")}</span>
      </main>
    </LocalizedTree>
  );
}

function app(children: ReactNode) {
  return <SiteLanguageProvider>{children}</SiteLanguageProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
  navigation.pathname = "/";
});

afterEach(() => cleanup());

describe("site language", () => {
  it("switches both ways, localizes accessible labels, and keeps user content and values", async () => {
    render(app(<LanguageContent />));

    expect(screen.getByText("Iniciar exploração")).toBeTruthy();
    expect(document.documentElement.lang).toBe("pt-BR");

    fireEvent.click(screen.getByRole("button", { name: "Choose English" }));
    expect(await screen.findByText("Start exploring")).toBeTruthy();
    expect(screen.getByRole("main", { name: "Main navigation" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Search crops").getAttribute("value")).toBe("soil");
    expect(screen.getByText("Uma anotação pessoal: água, pressão e rotina.")).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Mars Survival Guide — The next frontier");
    expect(window.localStorage.getItem("mars-survival-guide-language")).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: "Choose Portuguese" }));
    expect(await screen.findByText("Iniciar exploração")).toBeTruthy();
    expect(document.documentElement.lang).toBe("pt-BR");
    expect(document.title).toBe("Mars Survival Guide — A próxima fronteira");
  });

  it("restores the saved choice after reload and keeps it while the route changes", async () => {
    window.localStorage.setItem("mars-survival-guide-language", "en");
    const view = render(app(<LanguageContent />));

    expect(await screen.findByText("Start exploring")).toBeTruthy();
    navigation.pathname = "/mars-maps";
    view.rerender(app(<LanguageContent />));
    expect(screen.getByText("Start exploring")).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
  });

  it("translates the Mind Space screen and keeps its controls interactive", async () => {
    render(app(<><Header /><MindSpace /></>));

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(await screen.findByRole("heading", { name: "FAR FROM HOME. CLOSE TO YOU." })).toBeTruthy();
    expect(screen.getByText("MISSION JOURNAL")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Start meditation" }));
    expect(await screen.findByRole("button", { name: "Pause meditation" })).toBeTruthy();
  });

  it("renders Portuguese first on the server, then restores English without hydration mismatch", async () => {
    window.localStorage.setItem("mars-survival-guide-language", "en");
    const markup = renderToString(app(<LanguageContent />));
    expect(markup).toContain("Iniciar exploração");

    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.append(container);
    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    await act(async () => {
      root = hydrateRoot(container, app(<LanguageContent />), {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    await waitFor(() => expect(container.textContent).toContain("Start exploring"));
    expect(recoverableErrors).toEqual([]);
    await act(async () => root?.unmount());
    container.remove();
  });
});
