"use client";
import { useState } from "react";
import { Sprout, Leaf } from "lucide-react";
import { crops, comparisonFields } from "@/data/crops";
import { CropComparison } from "./CropComparison";
import u from "./ui.module.css";
import s from "./greenhouse.module.css";

export function Greenhouse() {
  const [selected, setSelected] = useState("lettuce");
  const [comparison, setComparison] = useState(["lettuce", "potato"]);
  const crop = crops.find((c) => c.id === selected)!;
  const Icon = crop.id === "lettuce" ? Leaf : Sprout;
  const toggleComparison = (id: string) =>
    setComparison((ids) =>
      ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id],
    );
  return (
    <main id="main" className={u.page}>
      <div className={u.eyebrow} style={{ color: "var(--green)" }}>
        <span className={u.dot} />
        03 / AGRICULTURA ESPACIAL
      </div>
      <div className={u.intro}>
        <h1>
          RAÍZES PARA
          <br />
          OUTROS MUNDOS.
        </h1>
        <p>
          Compare culturas e os desafios de um ambiente controlado. A pesquisa
          espacial inspira perguntas, sem prometer uma colheita em Marte.
        </p>
      </div>
      <div className={s.tabs} aria-label="Selecionar cultura">
        {crops.map((c) => (
          <button
            className={s.tab}
            key={c.id}
            aria-pressed={selected === c.id}
            onClick={() => setSelected(c.id)}
          >
            <Sprout size={22} />
            <span>
              {c.name}
              <span
                className={u.label}
                style={{ display: "block", marginTop: 5 }}
              >
                {c.tag}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className={u.largeGrid}>
        <div
          className={s.garden}
          role="img"
          aria-label={`Ilustração conceitual de ${crop.name} em ambiente controlado`}
        >
          <Icon className={s.plant} size={170} strokeWidth={1} />
          <span className={s.caption}>
            ILUSTRAÇÃO CONCEITUAL / SEM SIMULAÇÃO DE CRESCIMENTO
          </span>
        </div>
        <section className={`${u.panel} ${s.detail}`} aria-live="polite">
          <span className={u.badge}>{crop.evidence}</span>
          <h2>{crop.name.toUpperCase()}</h2>
          <span className={s.latin}>{crop.latin}</span>
          <p>{crop.description}</p>
          <div className={u.divider} />
          <span className={u.label}>AMBIENTE DE CULTIVO</span>
          <p>{crop.habitat}</p>
          <p className={u.source}>
            {crop.sources.map((source, i) => (
              <span key={source.url}>
                {i > 0 ? " · " : ""}
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </span>
            ))}
          </p>
        </section>
      </div>
      <div className={u.sectionTitle}>
        <h2>O QUE A PLANTA PRECISA?</h2>
        <p>Seleção atual: {crop.name}</p>
      </div>
      <div className={u.grid}>
        {comparisonFields.slice(0, 3).map((field) => (
          <article className={u.panel} key={field.key}>
            <span className={u.label}>{crop.tag}</span>
            <h3>{field.label}</h3>
            <p>{crop[field.key]}</p>
          </article>
        ))}
      </div>
      <CropComparison ids={comparison} onToggle={toggleComparison} />
      <p className={u.notice}>
        A comparação é qualitativa: sem volumes de água, doses, produtividade ou
        tempos de colheita inventados. Resultados da ISS e de outros voos não
        validam cultivo em Marte. A atmosfera, o substrato e o habitat marcianos
        exigem pesquisa específica.
      </p>
    </main>
  );
}
