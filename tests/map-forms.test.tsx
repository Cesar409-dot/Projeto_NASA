import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MarkerEditor } from "@/components/map/MarkerEditor";
import { MissionManager } from "@/components/map/MissionManager";
import {
  validDate,
  type MissionRoute,
  type PersonalMarker,
} from "@/lib/mars/exploration";
import { sciencePoints } from "@/data/science-points";
const marker: PersonalMarker = {
  id: "personal-form",
  name: "",
  description: "",
  category: "Exploração",
  visited: false,
  layerId: "ctx",
  coordinate: { ...sciencePoints[0].coordinate },
};
const route: MissionRoute = {
  origin: sciencePoints[0],
  destination: sciencePoints[1],
};
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function missionForm(currentRoute: MissionRoute | undefined = route) {
  const onSave = vi.fn(() => true);
  render(
    <MissionManager
      missions={[]}
      currentRoute={currentRoute}
      ready={true}
      onSave={onSave}
      onDelete={vi.fn()}
      onSelect={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
  fireEvent.change(screen.getByLabelText("Nome da missão"), {
    target: { value: "Missão válida" },
  });
  fireEvent.change(screen.getByLabelText("Objetivo"), {
    target: { value: "Objetivo válido" },
  });
  fireEvent.change(screen.getByLabelText("Data planejada"), {
    target: { value: "2026-12-01" },
  });
  return onSave;
}
function forceSubmit(label: string) {
  fireEvent.submit(screen.getByLabelText(label).closest("form")!);
}
describe("Validação do formulário de marcadores", () => {
  it.each(["", "   ", "\t\n\u00a0"])(
    "bloqueia nome vazio ou composto por espaços (%j), mesmo em submissão direta",
    (name) => {
      const onSave = vi.fn();
      render(
        <MarkerEditor marker={marker} onSave={onSave} onClose={vi.fn()} />,
      );
      fireEvent.change(screen.getByLabelText("Nome do marcador"), {
        target: { value: name },
      });
      expect(
        (
          screen.getByRole("button", {
            name: "Salvar marcador",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      forceSubmit("Nome do marcador");
      expect(onSave).not.toHaveBeenCalled();
    },
  );
  it("configura os limites dos campos e aceita o preenchimento nos limites", () => {
    const onSave = vi.fn();
    render(<MarkerEditor marker={marker} onSave={onSave} onClose={vi.fn()} />);
    const name = screen.getByLabelText("Nome do marcador") as HTMLInputElement;
    const description = screen.getByLabelText(
      "Descrição",
    ) as HTMLTextAreaElement;
    expect(name.maxLength).toBe(120);
    expect(description.maxLength).toBe(3000);
    const expectedName = "N".repeat(120),
      expectedDescription = "D".repeat(3000);
    fireEvent.change(name, { target: { value: expectedName } });
    fireEvent.change(description, { target: { value: expectedDescription } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      ...marker,
      name: expectedName,
      description: expectedDescription,
    });
  });
});
describe("Validação do formulário de missões", () => {
  it.each(["Nome da missão", "Objetivo"])(
    "rejeita espaços Unicode em %s e libera após corrigir",
    (label) => {
      const onSave = missionForm();
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "\u00a0\t " },
      });
      forceSubmit(label);
      expect(onSave).not.toHaveBeenCalled();
      expect(
        (
          screen.getByRole("button", {
            name: "Salvar missão",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "Texto corrigido" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
      expect(onSave).toHaveBeenCalledOnce();
    },
  );
  it.each(["2026-02-30", "2027-02-29", "2026-13-01"])(
    "rejeita a data impossível %s e aceita um dia bissexto válido",
    (date) => {
      expect(validDate(date)).toBe(false);
      const onSave = missionForm();
      fireEvent.change(screen.getByLabelText("Data planejada"), {
        target: { value: date },
      });
      forceSubmit("Data planejada");
      expect(onSave).not.toHaveBeenCalled();
      expect(
        (
          screen.getByRole("button", {
            name: "Salvar missão",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(validDate("2028-02-29")).toBe(true);
      fireEvent.change(screen.getByLabelText("Data planejada"), {
        target: { value: "2028-02-29" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
      expect(onSave).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ date: "2028-02-29" }),
      );
    },
  );
  it.each([
    "ausente",
    "mesmo ponto",
    "coordenadas coincidentes",
    "pontos antipodais",
  ])("bloqueia a submissão de uma rota inválida: %s", (scenario) => {
    let invalid: MissionRoute | undefined;
    if (scenario === "mesmo ponto")
      invalid = { origin: route.origin, destination: route.origin };
    else if (scenario === "coordenadas coincidentes")
      invalid = {
        origin: route.origin,
        destination: { ...route.origin, id: "outro-id" },
      };
    else if (scenario === "pontos antipodais")
      invalid = {
        origin: route.origin,
        destination: {
          ...route.origin,
          id: "antipodal",
          coordinate: {
            ...route.origin.coordinate,
            latitude: -route.origin.coordinate.latitude,
            longitude: route.origin.coordinate.longitude - 180,
          },
        },
      };
    // Pass the absent route explicitly; the regular fixture helper defaults to a valid route.
    const onSave = vi.fn(() => true);
    render(
      <MissionManager
        missions={[]}
        currentRoute={invalid}
        ready={true}
        onSave={onSave}
        onDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fireEvent.change(screen.getByLabelText("Nome da missão"), {
      target: { value: "Missão com rota inválida" },
    });
    fireEvent.change(screen.getByLabelText("Objetivo"), {
      target: { value: "Objetivo informado" },
    });
    fireEvent.change(screen.getByLabelText("Data planejada"), {
      target: { value: "2026-12-01" },
    });
    expect(
      within(screen.getByRole("dialog")).getByRole("status").textContent,
    ).toContain("Selecione origem e destino diferentes");
    forceSubmit("Nome da missão");
    expect(onSave).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: "Salvar missão",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("configura limites de nome, objetivo e descrição e aceita valores nos limites", () => {
    const onSave = missionForm();
    const name = screen.getByLabelText("Nome da missão") as HTMLInputElement;
    const objective = screen.getByLabelText("Objetivo") as HTMLInputElement;
    const description = screen.getByLabelText(
      "Descrição",
    ) as HTMLTextAreaElement;
    expect(name.maxLength).toBe(120);
    expect(objective.maxLength).toBe(500);
    expect(description.maxLength).toBe(3000);
    const expected = {
      name: "N".repeat(120),
      objective: "O".repeat(500),
      description: "D".repeat(3000),
    };
    fireEvent.change(name, { target: { value: expected.name } });
    fireEvent.change(objective, { target: { value: expected.objective } });
    fireEvent.change(description, { target: { value: expected.description } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining(expected),
    );
  });
});
