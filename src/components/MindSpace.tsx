"use client";
import { useEffect, useState } from "react";
import { Brain, Radio, Moon, Wind, Play, Pause, RotateCcw } from "lucide-react";
import u from "./ui.module.css";
export function MindSpace() {
  const [mood, setMood] = useState("");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <main id="main" className={u.page}>
      <div className={u.eyebrow} style={{ color: "var(--blue)" }}>
        <span className={u.dot} /> 02 / FATORES HUMANOS
      </div>
      <div className={u.intro}>
        <h1>
          LONGE DE CASA.
          <br />
          PERTO DE VOCÊ.
        </h1>
        <p>
          A mente também faz parte da missão. Um espaço de reflexão sobre
          conexão, rotina e bem-estar em ambientes isolados.
        </p>
      </div>
      <div className={u.largeGrid}>
        <section className={u.panel}>
          <div className={u.row}>
            <span className={u.label}>CHECK-IN DA TRIPULAÇÃO</span>
            <Brain color="var(--blue)" size={22} />
          </div>
          <h3>Como está seu espaço interior?</h3>
          <p>
            Escolha uma palavra para este momento. Não existe uma resposta
            certa.
          </p>
          <div className={u.choices}>
            {["Tranquilo", "Curioso", "Cansado", "Sobrecarregado"].map((m) => (
              <button
                className={u.choice}
                aria-pressed={mood === m}
                key={m}
                onClick={() => {
                  setMood(m);
                  setSaved(false);
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <label htmlFor="reflection" className={u.label}>
            O QUE VOCÊ GOSTARIA DE REGISTRAR?
          </label>
          <textarea
            id="reflection"
            className={u.field}
            rows={4}
            placeholder="Uma descoberta, uma dificuldade ou algo de que sente falta…"
            style={{ margin: "12px 0 18px", resize: "vertical" }}
            onChange={() => setSaved(false)}
          />
          <button
            className={u.button}
            disabled={!mood}
            onClick={() => setSaved(true)}
          >
            Concluir reflexão
          </button>
          <p className={u.status} aria-live="polite" style={{ marginTop: 12 }}>
            {saved
              ? "Pausa reconhecida. Obrigado por reservar esse momento."
              : ""}
          </p>
          <p className={u.source}>
            Demonstração: suas respostas ficam apenas nesta tela e são
            descartadas ao sair ou recarregar. Nenhuma informação é enviada ou
            armazenada.
          </p>
        </section>
        <section className={u.panel}>
          <div className={u.row}>
            <span className={u.label}>UMA PAUSA NO PERCURSO</span>
            <Wind color="var(--blue)" size={22} />
          </div>
          <div className={u.orb}>
            <span aria-live="off">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
          <h3>Encontre seu próprio ritmo.</h3>
          <p>
            Solte os ombros. Observe o ambiente. Respire no ritmo que for
            confortável para você.
          </p>
          <div className={u.choices}>
            <button
              className={`${u.button} ${u.secondary}`}
              onClick={() => setRunning(!running)}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}{" "}
              {running ? "Pausar" : "Iniciar pausa"}
            </button>
            <button
              aria-label="Reiniciar cronômetro"
              className={u.choice}
              onClick={() => {
                setRunning(false);
                setSeconds(0);
              }}
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </section>
      </div>
      <div className={u.sectionTitle}>
        <h2>O LADO HUMANO DA MISSÃO.</h2>
        <p>Três temas para explorar.</p>
      </div>
      <div className={u.grid}>
        {[
          {
            icon: Radio,
            title: "Conexão com a Terra",
            text: "Distância e isolamento transformam o contato com pessoas queridas. Comunicação e atividades significativas são temas de pesquisa para missões longas.",
          },
          {
            icon: Moon,
            title: "Rotina e descanso",
            text: "Uma missão também é feita de ciclos de trabalho, descanso e vida em equipe. Como criar espaço para as necessidades de cada pessoa?",
          },
          {
            icon: Brain,
            title: "Sentido e pertencimento",
            text: "Registrar experiências e cuidar de plantas são exemplos de atividades estudadas no contexto do bem-estar de tripulações.",
          },
        ].map((c) => (
          <article className={u.panel} key={c.title}>
            <c.icon color="var(--blue)" size={25} />
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </article>
        ))}
      </div>
      <p className={u.notice}>
        Conteúdo educativo sobre fatores humanos. Este check-in não é uma
        avaliação psicológica e não fornece diagnóstico ou tratamento.
      </p>
      <p className={u.source}>
        Referências:{" "}
        <a
          href="https://www.nasa.gov/humans-in-space/the-human-body-in-space/"
          target="_blank"
          rel="noreferrer"
        >
          NASA · The Human Body in Space
        </a>{" "}
        ·{" "}
        <a
          href="https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/"
          target="_blank"
          rel="noreferrer"
        >
          NASA · Space gardening and isolation
        </a>
      </p>
    </main>
  );
}
