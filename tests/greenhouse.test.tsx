import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Greenhouse } from "@/components/Greenhouse";

afterEach(cleanup);

function openCrop(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Inspecionar " + name }));
}

describe("inventário interativo da Mars Greenhouse", () => {
  it("exibe as 18 categorias e distingue a biofábrica das culturas vegetais", () => {
    render(<Greenhouse />);
    expect(screen.getAllByRole("button", { name: /^Inspecionar / })).toHaveLength(18);
    expect(screen.getByRole("button", { name: "Inspecionar Biomassa microbiana comestível" })).toBeTruthy();
    expect(screen.getByText("BIOFÁBRICA · MICRORGANISMOS")).toBeTruthy();
  });

  it("busca por espécie, filtra culturas e encontra a biofábrica", () => {
    render(<Greenhouse />);
    const search = screen.getByRole("searchbox", { name: "Buscar cultura" });
    fireEvent.change(search, { target: { value: "Raphanus sativus" } });
    expect(screen.getAllByRole("button", { name: /^Inspecionar / })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Inspecionar Rabanete / Cenoura / Beterraba" })).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Biofábrica" }));
    expect(screen.getAllByRole("button", { name: /^Inspecionar / })).toHaveLength(1);
    expect(screen.getByText("BIOFÁBRICA · MICRORGANISMOS")).toBeTruthy();
    fireEvent.change(search, { target: { value: "não existe" } });
    expect(screen.getByText(/Nenhuma categoria encontrada/)).toBeTruthy();
  });

  it("abre a inspeção sem trocar de página e apresenta espécies e modelo de biorreator", () => {
    render(<Greenhouse />);
    openCrop("Biomassa microbiana comestível");
    expect(screen.getByRole("heading", { name: "Biomassa microbiana comestível" })).toBeTruthy();
    expect(screen.getByText("Rhodosporidium toruloides")).toBeTruthy();
    expect(screen.getByText("Limnospira indica")).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Visualização tridimensional da cultura" })).toBeTruthy();
    expect(screen.getByText("Fotobiorreator")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar ao inventário" })).toBeTruthy();
  });

  it("altera a condição ambiental e atualiza a explicação e os sintomas visuais", () => {
    render(<Greenhouse />);
    openCrop("Batata");
    const water = screen.getByRole("slider", { name: "Água para Batata" });
    expect((water as HTMLInputElement).value).toBe("30");
    fireEvent.change(water, { target: { value: "0" } });
    expect(screen.getByRole("heading", { name: "Baixa disponibilidade de água" })).toBeTruthy();
    expect(screen.getAllByText(/inclina as folhas/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Abaixo da referência")).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Água para Batata" }).getAttribute("aria-valuetext")).toContain("Abaixo da referência");
    expect(screen.getByRole("meter", { name: "Dano ilustrativo acumulado" }).getAttribute("aria-valuenow")).toBe("0");
  });

  it("só acumula estresse ao avançar etapas, recupera gradualmente e restaura condições", () => {
    render(<Greenhouse />);
    openCrop("Batata");
    fireEvent.change(screen.getByRole("slider", { name: "Água para Batata" }), { target: { value: "0" } });
    const exposure = screen.getByRole("button", { name: /Avançar etapa de exposição/ });
    expect(screen.getByRole("meter", { name: "Dano ilustrativo acumulado" }).getAttribute("aria-valuenow")).toBe("0");
    fireEvent.click(exposure);
    const meter = screen.getByRole("meter", { name: "Dano ilustrativo acumulado" });
    expect(meter.getAttribute("aria-valuenow")).toBe("26");
    expect(screen.getByText("estresse leve")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Restaurar condições ideais" }));
    expect((screen.getByRole("slider", { name: "Água para Batata" }) as HTMLInputElement).value).toBe("30");
    expect(meter.getAttribute("aria-valuenow")).toBe("26");
    fireEvent.click(screen.getByRole("button", { name: "Avançar recuperação" }));
    expect(meter.getAttribute("aria-valuenow")).toBe("12");
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar dano" }));
    expect(meter.getAttribute("aria-valuenow")).toBe("0");
  });

  it("explica estresses por excesso de luz, baixa luz e temperatura extrema", () => {
    render(<Greenhouse />);
    openCrop("Tomate-anão");
    const light = screen.getByRole("slider", { name: "Luz para Tomate-anão" });
    fireEvent.change(light, { target: { value: "0" } });
    expect(screen.getByRole("heading", { name: "Exposição à luz reduzida" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Restaurar condições ideais" }));
    fireEvent.change(light, { target: { value: "1500" } });
    expect(screen.getByRole("heading", { name: "Exposição à luz elevada" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Restaurar condições ideais" }));
    fireEvent.change(screen.getByRole("slider", { name: "Temperatura para Tomate-anão" }), { target: { value: "40" } });
    expect(screen.getByRole("heading", { name: "Temperatura acima da referência" })).toBeTruthy();
  });

  it("só apresenta o estado crítico depois de várias etapas extremas", () => {
    render(<Greenhouse />);
    openCrop("Batata");
    fireEvent.change(screen.getByRole("slider", { name: "Água para Batata" }), { target: { value: "0" } });
    const step = screen.getByRole("button", { name: /Avançar etapa de exposição/ });
    const meter = screen.getByRole("meter", { name: "Dano ilustrativo acumulado" });
    expect(meter.getAttribute("aria-valuenow")).toBe("0");
    fireEvent.click(step);
    fireEvent.click(step);
    fireEvent.click(step);
    expect(meter.getAttribute("aria-valuenow")).toBe("78");
    expect(screen.getByText("estresse severo")).toBeTruthy();
    fireEvent.click(step);
    expect(meter.getAttribute("aria-valuenow")).toBe("100");
    expect(screen.getByText("colapso visual")).toBeTruthy();
  });

  it("troca categoria, oferece fallback sem WebGL e identifica a simulação como ilustrativa", async () => {
    render(<Greenhouse />);
    openCrop("Tomate-anão");
    expect(screen.getByRole("heading", { name: "Tomate-anão" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Luz para Tomate-anão" })).toBeTruthy();
    expect(screen.getAllByText(/aproximações educativas/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Simulação ambiental ilustrativa\. Não representa um modelo biológico validado/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText("MODO COMPATÍVEL")).toBeTruthy());
    expect(screen.getByRole("group", { name: "Controles do modelo 3D" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /fallback de Tomate-anão/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao inventário" }));
    openCrop("Biomassa microbiana comestível");
    expect(screen.getByText("Fotobiorreator")).toBeTruthy();
  });
});
