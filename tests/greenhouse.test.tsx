import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Greenhouse } from "@/components/Greenhouse";

afterEach(cleanup);

describe("inventário interativo da estufa", () => {
  it("mostra as dezoito categorias e mantém uma biofábrica distinta das plantas", () => {
    render(<Greenhouse />);
    expect(
      screen.getAllByRole("button", { name: /^Selecionar / }).length,
    ).toBe(18);
    expect(
      screen.getByRole("button", {
        name: "Selecionar Biomassa microbiana comestível",
      }),
    ).toBeTruthy();
    expect(screen.getByText("BIOFÁBRICA · MICRORGANISMOS")).toBeTruthy();
  });

  it("busca por nome popular e filtra culturas e biofábrica", () => {
    render(<Greenhouse />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cultura" }), {
      target: { value: "batata-doce" },
    });
    expect(
      screen.getAllByRole("button", { name: /^Selecionar / }).length,
    ).toBe(1);
    expect(
      screen.getByRole("button", { name: "Selecionar Batata-doce" }),
    ).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cultura" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Biofábrica" }));
    expect(
      screen.getAllByRole("button", { name: /^Selecionar / }).length,
    ).toBe(1);
    expect(
      screen.getByRole("button", {
        name: "Selecionar Biomassa microbiana comestível",
      }),
    ).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cultura" }), {
      target: { value: "nome inexistente" },
    });
    expect(screen.getByText(/Nenhuma categoria encontrada/).textContent).toMatch(
      /Nenhuma categoria encontrada/,
    );
  });

  it("muda a ficha e troca para a ilustração de biorreator quando selecionada", () => {
    render(<Greenhouse />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Selecionar Biomassa microbiana comestível",
      }),
    );
    expect(screen.getByText("Espécie e cepa não especificadas")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Biorreator ilustrativo/ })).toBeTruthy();
    expect(screen.getByText(/não uma planta convencional/)).toBeTruthy();
  });

  it("altera giro, zoom e aparência pelos controles visuais", () => {
    render(<Greenhouse />);
    const artwork = screen.getByRole("img", { name: /Batata/ });
    expect(artwork.getAttribute("style")).toContain("rotateY(0deg)");
    fireEvent.click(
      screen.getByRole("button", { name: "Girar cultura para a direita" }),
    );
    expect(artwork.getAttribute("style")).toContain("rotateY(18deg)");
    fireEvent.click(
      screen.getByRole("button", { name: "Aproximar visualização" }),
    );
    expect(screen.getByText("115% · VISTA INTERATIVA")).toBeTruthy();

    const water = screen.getByRole("group", { name: /Água disponível/ });
    fireEvent.click(within(water).getByRole("button", { name: "Baixa" }));
    const scene = screen
      .getByRole("region", { name: "Visualização ilustrativa" })
      .querySelector("[data-water]");
    expect(scene?.getAttribute("data-water")).toBe("baixa");
    expect(screen.getByText(/estresse hídrico ilustrativa/)).toBeTruthy();

    const light = screen.getByRole("group", { name: /Exposição à luz/ });
    fireEvent.click(within(light).getByRole("button", { name: "Baixa" }));
    expect(scene?.getAttribute("data-light")).toBe("baixa");
    expect(screen.getByText(/Iluminação da visualização reduzida/)).toBeTruthy();

    const temperature = screen.getByRole("group", { name: "Temperatura condição ilustrativa" });
    fireEvent.click(
      within(temperature).getByRole("button", { name: "Quente" }),
    );
    expect(scene?.getAttribute("data-temperature")).toBe("quente");
    expect(screen.getByText(/adequação da espécie não avaliada/)).toBeTruthy();
  });

  it("identifica a ilustração 2,5D como alternativa sem WebGL ou previsão biológica", () => {
    render(<Greenhouse />);
    expect(
      screen.getByText(/Simulação ambiental ilustrativa/),
    ).toBeTruthy();
    expect(screen.getByText(/ilustração 2,5D é vetorial e não anatômica/)).toBeTruthy();
    expect(screen.getByText(/SEM PREVISÃO DE CRESCIMENTO/)).toBeTruthy();
  });
});
