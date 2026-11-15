export const JOURNAL_STORAGE_KEY = "mars-survival-guide:mind-space:v1";
export const JOURNAL_DAILY_SUBMISSION_KEY = "mars-survival-guide:mind-space:last-submission-day:v1";

export type Rating = 1 | 2 | 3 | 4 | 5;

export type MindSpaceEntry = {
  id: string;
  date: string;
  emotion: Rating;
  energy: Rating;
  sleep: Rating;
  stress: Rating;
  physical: Rating;
  notes: string;
  createdAt: string;
};

export type RatingKey = "emotion" | "energy" | "sleep" | "stress" | "physical";

export const ratingLabels: Record<RatingKey, string> = {
  emotion: "Estado emocional",
  energy: "Energia",
  sleep: "Qualidade do sono",
  stress: "Estresse percebido",
  physical: "Condição física percebida",
};

export const emotionLabels: Record<Rating, string> = {
  1: "Muito difícil",
  2: "Difícil",
  3: "Neutro",
  4: "Bem",
  5: "Muito bem",
};

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMissionDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function parseMindSpaceEntries(raw: string | null): MindSpaceEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMindSpaceEntry);
  } catch {
    return [];
  }
}

export function createEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isMindSpaceEntry(value: unknown): value is MindSpaceEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<MindSpaceEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
    isRating(entry.emotion) &&
    isRating(entry.energy) &&
    isRating(entry.sleep) &&
    isRating(entry.stress) &&
    isRating(entry.physical) &&
    typeof entry.notes === "string" &&
    typeof entry.createdAt === "string"
  );
}

function isRating(value: unknown): value is Rating {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}
