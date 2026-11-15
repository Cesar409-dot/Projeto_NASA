"use client";

import { LocalizedTree } from "@/components/LocalizedTree";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarDays,
  HeartPulse,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import { MissionScenarios } from "./MissionScenarios";
import {
  createEntryId,
  emotionLabels,
  formatMissionDate,
  JOURNAL_DAILY_SUBMISSION_KEY,
  JOURNAL_STORAGE_KEY,
  localDateString,
  parseMindSpaceEntries,
  ratingLabels,
  type MindSpaceEntry,
  type Rating,
  type RatingKey,
} from "@/lib/mind-space";
import c from "./mind-space.module.css";
import u from "./ui.module.css";

type Draft = {
  date: string;
  emotion: Rating | null;
  energy: Rating | null;
  sleep: Rating | null;
  stress: Rating | null;
  physical: Rating | null;
  notes: string;
};

const ratingKeys: RatingKey[] = [
  "emotion",
  "energy",
  "sleep",
  "stress",
  "physical",
];

const ratingDescriptors: Record<Rating, string> = {
  1: "Muito baixo",
  2: "Baixo",
  3: "Intermediário",
  4: "Alto",
  5: "Muito alto",
};

const chartColors: Record<RatingKey, string> = {
  emotion: "#f47b50",
  energy: "#a1b8d2",
  sleep: "#b4cc9a",
  stress: "#d7a4b6",
  physical: "#d7bd87",
};

function emptyDraft(date = ""): Draft {
  return {
    date,
    emotion: null,
    energy: null,
    sleep: null,
    stress: null,
    physical: null,
    notes: "",
  };
}

function average(entries: MindSpaceEntry[], key: RatingKey): number | null {
  if (!entries.length) return null;
  return entries.reduce((total, entry) => total + entry[key], 0) / entries.length;
}

function displayAverage(value: number | null): string {
  return value === null
    ? "—"
    : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function trendDelta(entries: MindSpaceEntry[], key: RatingKey): number | null {
  if (entries.length < 6) return null;
  const recentSix = entries.slice(-6);
  const earlier = average(recentSix.slice(0, 3), key);
  const recent = average(recentSix.slice(3), key);
  return earlier === null || recent === null ? null : recent - earlier;
}

function suggestionFor(entry: MindSpaceEntry): { title: string; text: string } {
  if (entry.sleep <= 2) {
    return {
      title: "Observe o descanso",
      text: "Se fizer sentido para a rotina da missão, anote se horários, luz ou ruído acompanham a qualidade do sono. Rotinas de sono e ciclos de luz são temas estudados para ambientes isolados.",
    };
  }
  if (entry.stress >= 4) {
    return {
      title: "Reserve um momento de pausa",
      text: "Quando possível, escrever algumas linhas, fazer uma pausa atenta ou compartilhar uma necessidade com a equipe pode abrir espaço para reflexão. São ideias gerais, não um protocolo clínico.",
    };
  }
  if (entry.energy <= 2) {
    return {
      title: "Repare no ritmo do dia",
      text: "Observe como carga de trabalho, horários e pausas se relacionam com sua energia. Missões podem ter turnos e tarefas exigentes; converse com a equipe quando precisar de apoio.",
    };
  }
  return {
    title: "Cultive uma rotina significativa",
    text: "Uma atividade de lazer, um ritual pessoal ou um momento de conexão com a equipe pode ajudar a dar estrutura a dias parecidos. Escolha algo compatível com seu contexto.",
  };
}

function RatingScale({
  name,
  legend,
  value,
  onChange,
  lowLabel,
  highLabel,
  descriptors,
  disabled,
}: {
  name: RatingKey;
  legend: string;
  value: Rating | null;
  onChange: (rating: Rating) => void;
  lowLabel: string;
  highLabel: string;
  descriptors: Record<Rating, string>;
  disabled: boolean;
}) {
  const helpId = `${name}-scale-help`;
  return <LocalizedTree>{(
    <fieldset className={c.scale} aria-describedby={helpId}>
      <legend>{legend}</legend>
      <p id={helpId} className={c.scaleHelp}>
        Escolha de 1 a 5, conforme sua percepção de hoje.
      </p>
      <div className={c.scaleChoices}>
        {([1, 2, 3, 4, 5] as const).map((rating) => {
          const inputId = `${name}-${rating}`;
          return (
            <label
              className={c.scaleChoice}
              data-selected={value === rating}
              key={rating}
              htmlFor={inputId}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={rating}
                checked={value === rating}
                required
                disabled={disabled}
                aria-label={`${rating} de 5: ${descriptors[rating]}`}
                onChange={() => onChange(rating)}
              />
              <span aria-hidden="true">{rating}</span>
            </label>
          );
        })}
      </div>
      <div className={c.scaleEnds} aria-hidden="true">
        <span>1 · {lowLabel}</span>
        <span>5 · {highLabel}</span>
      </div>
    </fieldset>
  )}</LocalizedTree>;
}

function EvolutionChart({ entries }: { entries: MindSpaceEntry[] }) {
  const left = 46;
  const top = 22;
  const plotWidth = 634;
  const plotHeight = 148;
  const xFor = (index: number) =>
    entries.length < 2
      ? left + plotWidth / 2
      : left + (index * plotWidth) / (entries.length - 1);
  const yFor = (value: number) => top + ((5 - value) / 4) * plotHeight;

  return <LocalizedTree>{(
    <figure className={c.chartFigure}>
      <figcaption id="evolution-caption">
        Escalas autorrelatadas de 1 a 5 nos últimos {entries.length} registros.
      </figcaption>
      <svg
        className={c.chart}
        viewBox="0 0 720 224"
        role="img"
        aria-labelledby="evolution-title evolution-description"
      >
        <title id="evolution-title">Evolução dos registros do Mind Space</title>
        <desc id="evolution-description">
          Gráfico de linhas que compara estado emocional, energia, sono, estresse percebido e condição física percebida por data.
        </desc>
        {[1, 2, 3, 4, 5].map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className={c.chartGrid} x1={left} x2={left + plotWidth} y1={y} y2={y} />
              <text className={c.chartAxis} x={left - 14} y={y + 4} textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
        {ratingKeys.map((key) => (
          <g key={key}>
            {entries.length > 1 && (
              <polyline
                className={c.chartLine}
                points={entries
                  .map((entry, index) => `${xFor(index)},${yFor(entry[key])}`)
                  .join(" ")}
                stroke={chartColors[key]}
              />
            )}
            {entries.map((entry, index) => (
              <circle
                key={`${entry.id}-${key}`}
                className={c.chartPoint}
                cx={xFor(index)}
                cy={yFor(entry[key])}
                r="3.5"
                fill={chartColors[key]}
              />
            ))}
          </g>
        ))}
        {entries.map((entry, index) => (
          <text
            className={c.chartDate}
            key={entry.id}
            x={xFor(index)}
            y={top + plotHeight + 26}
            textAnchor="middle"
          >
            {formatMissionDate(entry.date).slice(0, 5)}
          </text>
        ))}
      </svg>
      <ul className={c.chartLegend} aria-label="Legenda do gráfico">
        {ratingKeys.map((key) => (
          <li key={key}>
            <span style={{ backgroundColor: chartColors[key] }} />
            {ratingLabels[key]}
          </li>
        ))}
      </ul>
    </figure>
  )}</LocalizedTree>;
}

export function MindSpace() {
  const [entries, setEntries] = useState<MindSpaceEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [dailySubmissionLocked, setDailySubmissionLocked] = useState(false);
  const dailySubmissionLockedRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    try {
      const saved = parseMindSpaceEntries(window.localStorage.getItem(JOURNAL_STORAGE_KEY));
      // Hydrate client-only storage after the server-rendered page mounts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries(saved);
      setSelectedEntryId(saved[0]?.id ?? null);
      const locked =
        window.localStorage.getItem(JOURNAL_DAILY_SUBMISSION_KEY) === localDateString();
      dailySubmissionLockedRef.current = locked;
      setDailySubmissionLocked(locked);
    } catch {
      setStorageError(true);
    } finally {
      setDraft((current) => ({ ...current, date: current.date || localDateString() }));
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
      // This state reflects whether the browser accepted the storage write.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [entries, storageReady]);

  useEffect(() => {
    function refreshDailyLock() {
      try {
        const locked =
          window.localStorage.getItem(JOURNAL_DAILY_SUBMISSION_KEY) === localDateString();
        dailySubmissionLockedRef.current = locked;
        setDailySubmissionLocked(locked);
      } catch {
        setStorageError(true);
      }
    }
    const interval = window.setInterval(refreshDailyLock, 60_000);
    window.addEventListener("focus", refreshDailyLock);
    window.addEventListener("storage", refreshDailyLock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshDailyLock);
      window.removeEventListener("storage", refreshDailyLock);
    };
  }, []);

  const orderedEntries = useMemo(
    () =>
      [...entries].sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.createdAt.localeCompare(second.createdAt),
      ),
    [entries],
  );
  const selectedEntry =
    orderedEntries.find((entry) => entry.id === selectedEntryId) ??
    orderedEntries[orderedEntries.length - 1] ??
    null;
  const recentEntries = orderedEntries.slice(-7);
  const recentAverages = orderedEntries.slice(-7);
  const suggestion = selectedEntry ? suggestionFor(selectedEntry) : null;
  const selectedIndex = selectedEntry
    ? orderedEntries.findIndex((entry) => entry.id === selectedEntry.id)
    : -1;
  const previousEntry = selectedIndex > 0 ? orderedEntries[selectedIndex - 1] : null;

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback("");
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const today = localDateString();
    let alreadySubmitted = dailySubmissionLockedRef.current;
    try {
      alreadySubmitted =
        alreadySubmitted ||
        window.localStorage.getItem(JOURNAL_DAILY_SUBMISSION_KEY) === today;
    } catch {
      // The in-memory lock still protects repeated submits in this page session.
    }
    if (alreadySubmitted) {
      dailySubmissionLockedRef.current = true;
      setDailySubmissionLocked(true);
      setFeedback("O envio de hoje já foi realizado. Um novo envio será liberado amanhã.");
      return;
    }
    if (
      !draft.date ||
      draft.emotion === null ||
      draft.energy === null ||
      draft.sleep === null ||
      draft.stress === null ||
      draft.physical === null
    ) {
      setFeedback("Preencha a data e selecione uma opção em cada escala.");
      return;
    }

    const duplicateMissionDate = entries.some(
      (entry) => entry.date === draft.date && entry.id !== editingId,
    );
    if (duplicateMissionDate) {
      setFeedback("Já existe um registro para essa data da missão. Escolha outro dia ou edite o registro existente.");
      return;
    }

    const original = editingId
      ? entries.find((entry) => entry.id === editingId)
      : undefined;
    const entry: MindSpaceEntry = {
      id: editingId ?? createEntryId(),
      date: draft.date,
      emotion: draft.emotion,
      energy: draft.energy,
      sleep: draft.sleep,
      stress: draft.stress,
      physical: draft.physical,
      notes: draft.notes.trim(),
      createdAt: original?.createdAt ?? new Date().toISOString(),
    };

    setEntries((current) =>
      editingId
        ? current.map((saved) => (saved.id === editingId ? entry : saved))
        : [entry, ...current],
    );
    setSelectedEntryId(entry.id);
    setEditingId(null);
    setDraft(emptyDraft(localDateString()));
    dailySubmissionLockedRef.current = true;
    setDailySubmissionLocked(true);
    try {
      window.localStorage.setItem(JOURNAL_DAILY_SUBMISSION_KEY, today);
    } catch {
      setStorageError(true);
    }
    setFeedback("Registro enviado. O próximo envio será liberado amanhã.");
  }

  function startEditing(entry: MindSpaceEntry) {
    if (dailySubmissionLockedRef.current) return;
    setDraft({
      date: entry.date,
      emotion: entry.emotion,
      energy: entry.energy,
      sleep: entry.sleep,
      stress: entry.stress,
      physical: entry.physical,
      notes: entry.notes,
    });
    setEditingId(entry.id);
    setFeedback("Editando registro. Salve as alterações ou cancele.");
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(emptyDraft(localDateString()));
    setFeedback("Edição cancelada.");
  }

  function deleteEntry(id: string) {
    const remaining = entries.filter((entry) => entry.id !== id);
    setEntries(remaining);
    if (selectedEntryId === id) setSelectedEntryId(null);
    if (editingId === id) cancelEditing();
    else setFeedback("Registro excluído.");
  }

  return <LocalizedTree>{(
    <main id="main" className={`${u.page} ${c.page}`}>
      <div className={u.eyebrow}>
        <span className={u.dot} /> 02 / FATORES HUMANOS
      </div>
      <div className={`${u.intro} ${c.intro}`}>
        <div>
          <h1>
            LONGE DE CASA.
            <br />
            PERTO DE VOCÊ.
          </h1>
          <p>
            Um diário de missão para observar corpo, emoções e rotina ao longo da jornada em Marte.
          </p>
        </div>
        <a className={c.jumpLink} href="#registro">
          Registrar meu dia <ArrowDownRight size={16} />
        </a>
      </div>

      <section className={c.journalLayout} aria-label="Diário e pausa da missão">
        <div className={c.panel} id="registro">
          <div className={c.panelHeading}>
            <div>
              <span className={u.label}>DIÁRIO DA MISSÃO</span>
              <h2>{editingId ? "Editar registro" : "Registrar o dia"}</h2>
              <p>Faça um check-in breve, usando suas próprias referências.</p>
            </div>
            <CalendarDays size={23} aria-hidden="true" />
          </div>
          <form className={c.form} onSubmit={saveEntry}>
            <p className={c.dailyPolicy}>
              Limite diário: 1 envio por dia do calendário local. Salvar uma edição também conta como envio.
            </p>
            {dailySubmissionLocked && (
              <p className={c.dailyLock} role="status" aria-live="polite">
                O envio de hoje já foi realizado. O formulário será liberado amanhã.
              </p>
            )}
            <label className={c.dateField} htmlFor="mission-date">
              <span>Data da missão</span>
              <input
                id="mission-date"
                type="date"
                required
                disabled={dailySubmissionLocked}
                value={draft.date}
                onChange={(event) => updateDraft("date", event.target.value)}
              />
            </label>
            <div className={c.scales}>
              <RatingScale
                name="emotion"
                legend={ratingLabels.emotion}
                value={draft.emotion}
                descriptors={emotionLabels}
                lowLabel="muito difícil"
                highLabel="muito bem"
                disabled={dailySubmissionLocked}
                onChange={(value) => updateDraft("emotion", value)}
              />
              <RatingScale
                name="energy"
                legend={ratingLabels.energy}
                value={draft.energy}
                descriptors={ratingDescriptors}
                lowLabel="muito baixa"
                highLabel="muito alta"
                disabled={dailySubmissionLocked}
                onChange={(value) => updateDraft("energy", value)}
              />
              <RatingScale
                name="sleep"
                legend={ratingLabels.sleep}
                value={draft.sleep}
                descriptors={ratingDescriptors}
                lowLabel="muito ruim"
                highLabel="muito boa"
                disabled={dailySubmissionLocked}
                onChange={(value) => updateDraft("sleep", value)}
              />
              <RatingScale
                name="stress"
                legend={ratingLabels.stress}
                value={draft.stress}
                descriptors={ratingDescriptors}
                lowLabel="muito baixo"
                highLabel="muito alto"
                disabled={dailySubmissionLocked}
                onChange={(value) => updateDraft("stress", value)}
              />
              <RatingScale
                name="physical"
                legend={ratingLabels.physical}
                value={draft.physical}
                descriptors={ratingDescriptors}
                lowLabel="muito limitada"
                highLabel="muito boa"
                disabled={dailySubmissionLocked}
                onChange={(value) => updateDraft("physical", value)}
              />
            </div>
            <label className={c.notesField} htmlFor="mission-notes">
              <span>Observações pessoais <small>opcional</small></span>
              <textarea
                id="mission-notes"
                value={draft.notes}
                rows={4}
                maxLength={600}
                disabled={dailySubmissionLocked}
                placeholder="O que você gostaria de lembrar sobre este dia?"
                onChange={(event) => updateDraft("notes", event.target.value)}
              />
              <small className={c.characterCount}>{draft.notes.length}/600</small>
            </label>
            <div className={c.formFooter}>
              <p role="status" aria-live="polite">
                {dailySubmissionLocked
                  ? "O envio diário foi concluído. O próximo envio será liberado amanhã."
                  : feedback}
              </p>
              <div>
                {editingId && !dailySubmissionLocked && (
                  <button className={c.cancelButton} type="button" onClick={cancelEditing}>
                    <X size={16} /> Cancelar
                  </button>
                )}
                <button className={u.button} type="submit" disabled={dailySubmissionLocked}>
                  <Save size={16} /> {dailySubmissionLocked ? "Envio diário concluído" : editingId ? "Salvar alterações" : "Enviar registro"}
                </button>
              </div>
            </div>
          </form>
          <p className={c.localNote}>
            <span className={c.localDot} />
            {storageError
              ? "O navegador não permitiu acessar o armazenamento local. Este registro pode não permanecer após fechar a página."
              : "Seus registros ficam neste navegador, neste dispositivo. Eles não são enviados a um servidor."}
          </p>
        </div>

        <aside className={`${c.panel} ${c.pausePanel}`} aria-label="Pausa da missão">
          <div className={c.panelHeading}>
            <div>
              <span className={u.label}>TEMPORIZADOR DE MEDITAÇÃO</span>
              <h2>Cronômetro de meditação</h2>
            </div>
            <Wind size={22} aria-hidden="true" />
          </div>
          <p>Use o cronômetro para acompanhar o tempo da sua meditação. A prática é livre; respire no ritmo que for confortável para você.</p>
          <div className={u.orb}>
            <span aria-live="off">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
          <div className={c.pauseActions}>
            <button className={`${u.button} ${u.secondary}`} type="button" onClick={() => setRunning((current) => !current)}>
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? "Pausar meditação" : "Iniciar meditação"}
            </button>
            <button
              aria-label="Reiniciar cronômetro de meditação"
              className={c.resetButton}
              type="button"
              onClick={() => {
                setRunning(false);
                setSeconds(0);
              }}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <p className={c.pauseFootnote}>O cronômetro apenas acompanha a duração; ele não orienta uma técnica de meditação ou respiração.</p>
        </aside>
      </section>

      <section className={c.dashboard} aria-labelledby="dashboard-title">
        <div className={c.sectionHeading}>
          <div>
            <span className={u.label}>ACOMPANHAMENTO PESSOAL</span>
            <h2 id="dashboard-title">Seu diário, dia após dia</h2>
          </div>
          <p>As escalas mostram suas percepções ao longo do tempo; não são indicadores médicos.</p>
        </div>
        <div className={c.summaryGrid}>
          <article className={c.summaryCard}>
            <span><Activity size={16} /> REGISTROS</span>
            <strong>{entries.length}</strong>
            <small>{entries.length === 1 ? "dia acompanhado" : "dias acompanhados"}</small>
          </article>
          <article className={c.summaryCard}>
            <span><Brain size={16} /> ESTADO EMOCIONAL</span>
            <strong>{displayAverage(average(recentAverages, "emotion"))}</strong>
            <small>média das últimas {recentAverages.length} entradas · de 5</small>
          </article>
          <article className={c.summaryCard}>
            <span><Moon size={16} /> QUALIDADE DO SONO</span>
            <strong>{displayAverage(average(recentAverages, "sleep"))}</strong>
            <small>média das últimas {recentAverages.length} entradas · de 5</small>
          </article>
          <article className={c.summaryCard}>
            <span><HeartPulse size={16} /> ESTRESSE PERCEBIDO</span>
            <strong>{displayAverage(average(recentAverages, "stress"))}</strong>
            <small>média das últimas {recentAverages.length} entradas · de 5</small>
          </article>
        </div>

        <div className={c.dashboardGrid}>
          <section className={`${c.panel} ${c.chartPanel}`} aria-labelledby="chart-heading">
            <div className={c.panelHeading}>
              <div>
                <span className={u.label}>TENDÊNCIAS</span>
                <h3 id="chart-heading">Evolução das escalas</h3>
              </div>
              <span className={c.periodBadge}>ÚLTIMOS 7 REGISTROS</span>
            </div>
            {recentEntries.length ? (
              <EvolutionChart entries={recentEntries} />
            ) : (
              <p className={c.emptyChart}>Seu gráfico aparecerá depois do primeiro registro.</p>
            )}
            <div className={c.trendBox}>
              <strong><Sparkles size={16} /> Comparação de tendências</strong>
              {orderedEntries.length >= 6 ? (
                <>
                  <p>Variação entre as três entradas recentes e as três anteriores, em cada escala:</p>
                  <ul className={c.trendList}>
                    {ratingKeys.map((key) => {
                      const delta = trendDelta(orderedEntries, key);
                      const steady = delta !== null && Math.abs(delta) < 0.2;
                      const Icon = delta !== null && delta > 0 ? ArrowUpRight : ArrowDownRight;
                      return (
                        <li key={key}>
                          <span>{ratingLabels[key]}</span>
                          <b data-steady={steady}>
                            {steady ? "sem variação relevante" : `${delta !== null && delta > 0 ? "+" : ""}${delta?.toFixed(1)} ponto(s)`}
                            {!steady && delta !== null && <Icon size={14} aria-hidden="true" />}
                          </b>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p>Com seis registros, você poderá comparar as três entradas mais recentes com as três anteriores.</p>
              )}
            </div>
          </section>

          <section className={`${c.panel} ${c.historyPanel}`} aria-labelledby="history-heading">
            <div className={c.panelHeading}>
              <div>
                <span className={u.label}>HISTÓRICO</span>
                <h3 id="history-heading">Registros anteriores</h3>
              </div>
              <span className={c.countBadge}>{entries.length}</span>
            </div>
            {entries.length ? (
              <div className={c.historyList}>
                {[...orderedEntries].reverse().map((entry) => (
                  <article className={c.historyItem} data-active={selectedEntry?.id === entry.id} key={entry.id}>
                    <button className={c.historySelect} type="button" onClick={() => setSelectedEntryId(entry.id)}>
                      <span>{formatMissionDate(entry.date)}</span>
                      <strong>{emotionLabels[entry.emotion]}</strong>
                      <small>Energia {entry.energy}/5 <i /> Sono {entry.sleep}/5 <i /> Estresse {entry.stress}/5</small>
                    </button>
                    <div className={c.historyActions}>
                      <button type="button" aria-label={`Editar registro de ${formatMissionDate(entry.date)}`} disabled={dailySubmissionLocked} onClick={() => startEditing(entry)}>
                        <Activity size={15} /> <span>Editar</span>
                      </button>
                      <button type="button" aria-label={`Excluir registro de ${formatMissionDate(entry.date)}`} onClick={() => deleteEntry(entry.id)}>
                        <Trash2 size={15} /> <span>Excluir</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={c.emptyHistory}>Seus dias registrados aparecerão aqui. Comece pelo check-in acima.</p>
            )}
          </section>
        </div>

        {selectedEntry && (
          <section className={`${c.panel} ${c.dayDetail}`} aria-labelledby="day-detail-heading">
            <div className={c.panelHeading}>
              <div>
                <span className={u.label}>DETALHE DO DIA · {formatMissionDate(selectedEntry.date)}</span>
                <h3 id="day-detail-heading">Como foi este dia?</h3>
              </div>
              <button className={c.detailEdit} type="button" disabled={dailySubmissionLocked} onClick={() => startEditing(selectedEntry)}>
                <Activity size={15} /> Editar este registro
              </button>
            </div>
            <div className={c.detailGrid}>
              {ratingKeys.map((key) => (
                <div className={c.detailMetric} key={key}>
                  <span>{ratingLabels[key]}</span>
                  <strong>{key === "emotion" ? emotionLabels[selectedEntry[key]] : `${selectedEntry[key]} / 5`}</strong>
                </div>
              ))}
            </div>
            {selectedEntry.notes && (
              <blockquote className={c.notesQuote}>
                <span>OBSERVAÇÕES PESSOAIS</span>
                <p data-language-ignore>{selectedEntry.notes}</p>
              </blockquote>
            )}
            {previousEntry ? (
              <div className={c.comparison}>
                <strong>Comparação com {formatMissionDate(previousEntry.date)}</strong>
                <div className={c.compareGrid}>
                  {ratingKeys.map((key) => (
                    <span key={key}>
                      {ratingLabels[key]} <b>{previousEntry[key]} → {selectedEntry[key]}</b>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className={c.comparisonHint}>Este é o primeiro dia do histórico para comparar.</p>
            )}
          </section>
        )}

        {suggestion && selectedEntry && (
          <aside className={c.suggestion} aria-label="Sugestão educativa">
            <Sparkles size={18} aria-hidden="true" />
            <div>
              <span className={u.label}>IDEIA PARA REFLETIR</span>
              <h3>{suggestion.title}</h3>
              <p>{suggestion.text}</p>
            </div>
          </aside>
        )}
      </section>

      <section className={c.learning} aria-labelledby="learning-heading">
        <div className={c.sectionHeading}>
          <div>
            <span className={u.label}>CONTEXTO DA MISSÃO</span>
            <h2 id="learning-heading">Bem-estar também faz parte da jornada</h2>
          </div>
          <p>Uma visão educativa sobre fatores humanos em viagens de longa duração.</p>
        </div>
        <div className={c.learningGrid}>
          <article>
            <span className={c.learningIndex}>01 / CONVIVÊNCIA</span>
            <h3>Isolamento e confinamento</h3>
            <p>Distância da família, contato limitado e espaço restrito tornam conexão, privacidade e dinâmica da equipe assuntos importantes para missões prolongadas.</p>
            <a href="https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/" target="_blank" rel="noreferrer">Fonte NASA <ArrowUpRight size={14} /></a>
          </article>
          <article>
            <span className={c.learningIndex}>02 / DESCANSO</span>
            <h3>Sono e ritmos</h3>
            <p>Horários variáveis, luz, ruído e o dia marciano mais longo podem afetar o alinhamento dos ritmos biológicos e a qualidade do descanso.</p>
            <a href="https://www.nasa.gov/humans-in-space/the-human-body-in-space/" target="_blank" rel="noreferrer">Fonte NASA <ArrowUpRight size={14} /></a>
          </article>
          <article>
            <span className={c.learningIndex}>03 / CARGA DE TRABALHO</span>
            <h3>Estresse e fadiga</h3>
            <p>Períodos de muito trabalho e mudanças de agenda podem trazer fadiga. Acompanhar sono, energia e percepções ajuda a descrever a experiência individual.</p>
            <a href="https://www.nasa.gov/humans-in-space/the-human-body-in-space/" target="_blank" rel="noreferrer">Fonte NASA <ArrowUpRight size={14} /></a>
          </article>
          <article>
            <span className={c.learningIndex}>04 / ADAPTAÇÃO</span>
            <h3>Rotina em ambiente extremo</h3>
            <p>Atividades significativas, autocuidado, comunicação e trabalho em equipe são temas considerados para apoiar tripulações em ambientes isolados.</p>
            <a href="https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/" target="_blank" rel="noreferrer">Fonte NASA <ArrowUpRight size={14} /></a>
          </article>
        </div>
        <p className={c.scienceNote}>
          As informações são educativas e sintetizam as referências indicadas no projeto. Este diário não oferece diagnóstico, classificação de risco ou tratamento e não substitui apoio profissional.
        </p>
      </section>

      <MissionScenarios />
      <p className={u.source}>
        As escalas registram percepções pessoais e servem para observação individual. A NASA descreve o uso de diários e rotinas como temas de apoio e pesquisa em isolamento; as sugestões deste protótipo não são protocolos oficiais.
      </p>
    </main>
  )}</LocalizedTree>;
}
