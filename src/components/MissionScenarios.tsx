"use client";
import { useState } from "react";
import { missionScenarios } from "@/data/mission-scenarios";
import u from "./ui.module.css";
import s from "./scenarios.module.css";

export function MissionScenarios() {
  const [selected, setSelected] = useState(missionScenarios[0].id);
  const scenario = missionScenarios.find((s) => s.id === selected)!;
  return (
    <section aria-label="Cenários de missão">
      <div className={u.sectionTitle}>
        <h2>ESCOLHAS NO ESPAÇO.</h2>
        <p>Explore um cenário de cada vez.</p>
      </div>
      <div className={s.layout}>
        <div className={s.options} aria-label="Selecionar cenário">
          {missionScenarios.map((s, i) => (
            <button
              className={u.choice}
              key={s.id}
              aria-pressed={selected === s.id}
              onClick={() => setSelected(s.id)}
            >
              <span className={u.label}>
                0{i + 1} / {s.theme}
              </span>
              <strong>{s.title}</strong>
            </button>
          ))}
        </div>
        <article className={u.panel} aria-live="polite">
          <span className={u.label}>{scenario.theme}</span>
          <h3>{scenario.title}</h3>
          <p>{scenario.situation}</p>
          <p className={s.explanation}>{scenario.explanation}</p>
          <div key={scenario.id} className={s.strategies}>
            {scenario.strategies.map((strategy) => (
              <details key={strategy.title}>
                <summary>{strategy.title}</summary>
                <p>{strategy.text}</p>
              </details>
            ))}
          </div>
          <p className={u.notice}>{scenario.reflection}</p>
          <p className={u.source}>
            <a href={scenario.source} target="_blank" rel="noreferrer">
              Ler a referência NASA
            </a>
          </p>
        </article>
      </div>
      <p className={u.source}>
        Cenários fictícios e atividades adaptadas para educação. As sugestões
        não são protocolos oficiais de missão, terapia ou avaliação psicológica.
      </p>
    </section>
  );
}
