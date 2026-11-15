import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MindSpace } from "@/components/MindSpace";
import {
  JOURNAL_DAILY_SUBMISSION_KEY,
  JOURNAL_STORAGE_KEY,
  localDateString,
  type RatingKey,
} from "@/lib/mind-space";

const ratingNames: Record<RatingKey, string> = {
  emotion: "emotion",
  energy: "energy",
  sleep: "sleep",
  stress: "stress",
  physical: "physical",
};

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function localNoon(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function completeForm({
  date,
  values,
  notes = "",
}: {
  date: string;
  values: Record<RatingKey, number>;
  notes?: string;
}) {
  fireEvent.change(screen.getByLabelText("Data da missão"), {
    target: { value: date },
  });
  for (const key of Object.keys(ratingNames) as RatingKey[]) {
    const radio = document.querySelector<HTMLInputElement>(
      `input[name="${ratingNames[key]}"][value="${values[key]}"]`,
    );
    if (!radio) throw new Error(`Radio for ${key} was not found`);
    fireEvent.click(radio);
  }
  fireEvent.change(document.getElementById("mission-notes")!, {
    target: { value: notes },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar registro" }));
}

describe("Mind Space journal", () => {
  it("validates the form, saves a daily record and restores it from local storage", () => {
    const firstView = render(<MindSpace />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar registro" }));
    expect(screen.getByText("Seu gráfico aparecerá depois do primeiro registro.")).toBeTruthy();

    completeForm({
      date: "2026-10-04",
      values: { emotion: 4, energy: 3, sleep: 4, stress: 2, physical: 5 },
      notes: "O turno correu bem e a equipe compartilhou uma refeição.",
    });

    expect(screen.getByText("O turno correu bem e a equipe compartilhou uma refeição.")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Evolução dos registros do Mind Space/ })).toBeTruthy();
    expect(screen.getByText("dia acompanhado").closest("article")?.textContent).toContain("1");
    expect(screen.getByText("ESTADO EMOCIONAL").closest("article")?.textContent).toContain("4,0");

    const saved = JSON.parse(window.localStorage.getItem(JOURNAL_STORAGE_KEY) ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ date: "2026-10-04", energy: 3, sleep: 4, stress: 2 });
    expect(window.localStorage.getItem(JOURNAL_DAILY_SUBMISSION_KEY)).toBe(localDateString());
    expect((screen.getByRole("button", { name: "Envio diário concluído" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(document.querySelector("form")!);
    expect(JSON.parse(window.localStorage.getItem(JOURNAL_STORAGE_KEY) ?? "[]")).toHaveLength(1);

    firstView.unmount();
    render(<MindSpace />);
    expect(screen.getByText("O turno correu bem e a equipe compartilhou uma refeição.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Editar registro de 04\/10\/2026/ })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Envio diário concluído" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("edits and deletes a saved record", () => {
    vi.useFakeTimers();
    vi.setSystemTime(localNoon("2026-10-05"));
    render(<MindSpace />);
    completeForm({
      date: "2026-10-05",
      values: { emotion: 2, energy: 2, sleep: 3, stress: 4, physical: 3 },
      notes: "Primeira anotação",
    });

    expect((screen.getByRole("button", { name: "Envio diário concluído" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    vi.setSystemTime(localNoon("2026-10-06"));
    render(<MindSpace />);
    fireEvent.click(screen.getByRole("button", { name: /Editar registro de 05\/10\/2026/ }));
    expect(screen.getByRole("heading", { name: "Editar registro" })).toBeTruthy();
    fireEvent.change(document.getElementById("mission-notes")!, {
      target: { value: "Anotação revisada" },
    });
    const betterEnergy = document.querySelector<HTMLInputElement>(
      'input[name="energy"][value="4"]',
    )!;
    fireEvent.click(betterEnergy);
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByText("Anotação revisada")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(JOURNAL_STORAGE_KEY) ?? "[]")[0].energy).toBe(4);

    fireEvent.click(screen.getByRole("button", { name: /Excluir registro de 05\/10\/2026/ }));
    expect(screen.getByText("dias acompanhados").closest("article")?.textContent).toContain("0");
    expect(screen.getByText("Seu gráfico aparecerá depois do primeiro registro.")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(JOURNAL_STORAGE_KEY) ?? "[]")).toHaveLength(0);
    expect(window.localStorage.getItem(JOURNAL_DAILY_SUBMISSION_KEY)).toBe("2026-10-06");
    expect((screen.getByRole("button", { name: "Envio diário concluído" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("updates the chart and compares recent trends after six entries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(localNoon("2026-10-01"));
    let view = render(<MindSpace />);
    for (let day = 1; day <= 6; day += 1) {
      if (day > 1) {
        view.unmount();
        vi.setSystemTime(localNoon(`2026-10-0${day}`));
        view = render(<MindSpace />);
      }
      completeForm({
        date: `2026-10-0${day}`,
        values: {
          emotion: Math.min(5, day),
          energy: Math.min(5, day),
          sleep: 3,
          stress: Math.max(1, 6 - day),
          physical: 4,
        },
      });
    }

    expect(screen.getByText("dias acompanhados").closest("article")?.textContent).toContain("6");
    expect(screen.getByText(/Variação entre as três entradas recentes/)).toBeTruthy();
    expect(screen.getByRole("img", { name: /Evolução dos registros do Mind Space/ })).toBeTruthy();
    expect(document.querySelectorAll("polyline")).toHaveLength(5);
    expect(screen.getByText("Comparação com 05/10/2026")).toBeTruthy();
  });
});
