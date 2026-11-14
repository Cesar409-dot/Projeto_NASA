"use client";
import { useState } from "react";
import {
  Sprout,
  Leaf,
  Flower2,
  Sun,
  Droplets,
  FlaskConical,
} from "lucide-react";
import { crops } from "@/data/mission";
import u from "./ui.module.css";
import s from "./greenhouse.module.css";
export function Greenhouse() {
  const [selected, setSelected] = useState("lettuce");
  const [light, setLight] = useState(50);
  const [water, setWater] = useState(50);
  const crop = crops.find((c) => c.id === selected)!;
  const Icon =
    crop.icon === "leaf" ? Leaf : crop.icon === "flower" ? Flower2 : Sprout;
  return (
    <main id="main" className={u.page}>
      <div className={u.eyebrow} style={{ color: "var(--green)" }}>
        <span className={u.dot} /> 03 / AGRICULTURA ESPACIAL
      </div>
      <div className={u.intro}>
        <h1>
          RAÍZES PARA
          <br />
          OUTROS MUNDOS.
        </h1>
        <p>
          Antes de uma horta em Marte, uma pergunta: o que uma planta precisa
          para viver longe da Terra?
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
          style={{
            background: `radial-gradient(ellipse at 50% 70%,rgba(130,160,80,${0.05 + light / 400}),transparent 70%),#111917`,
          }}
          role="img"
          aria-label={`Ilustração conceitual de ${crop.name} em habitat controlado`}
        >
          <Icon className={s.plant} size={170} strokeWidth={1} />
          <span className={s.caption}>
            HABITAT CONTROLADO / ILUSTRAÇÃO CONCEITUAL
          </span>
        </div>
        <section className={`${u.panel} ${s.detail}`} aria-live="polite">
          <span className={u.badge}>CULTURAS ESTUDADAS NA ISS</span>
          <h2>{crop.name.toUpperCase()}</h2>
          <span className={s.latin}>{crop.latin}</span>
          <p>{crop.description}</p>
          <div className={u.divider} />
          <span className={u.label}>O QUE A CIÊNCIA INVESTIGA</span>
          <p>{crop.focus}</p>
        </section>
      </div>
      <div className={u.sectionTitle}>
        <h2>UM ECOSSISTEMA EM EQUILÍBRIO.</h2>
        <p>Explore os fatores do cultivo.</p>
      </div>
      <div className={u.grid}>
        <section className={u.panel}>
          <Sun size={25} color="var(--green)" />
          <h3>Luz</h3>
          <p>
            A iluminação é um dos fatores investigados no cultivo em ambientes
            controlados.
          </p>
          <div className={s.control}>
            <label htmlFor="light">
              Intensidade visual <span>{light}%</span>
            </label>
            <input
              id="light"
              type="range"
              min="0"
              max="100"
              value={light}
              onChange={(e) => setLight(Number(e.target.value))}
            />
          </div>
          <p className={u.source}>
            Controle ilustrativo: altera apenas a iluminação do desenho.
          </p>
        </section>
        <section className={u.panel}>
          <Droplets size={25} color="var(--green)" />
          <h3>Água</h3>
          <p>
            O manejo da água e dos nutrientes é essencial para desenvolver
            sistemas de cultivo espacial.
          </p>
          <div className={s.control}>
            <label htmlFor="water">
              Reserva ilustrativa <span>{water}%</span>
            </label>
            <input
              id="water"
              type="range"
              min="0"
              max="100"
              value={water}
              onChange={(e) => setWater(Number(e.target.value))}
            />
            <progress
              max="100"
              value={water}
              aria-label="Reserva ilustrativa de água"
              style={{ width: "100%", accentColor: "var(--green)" }}
            />
          </div>
          <p className={u.source}>
            Sem unidade física ou previsão de crescimento.
          </p>
        </section>
        <section className={u.panel}>
          <FlaskConical size={25} color="var(--green)" />
          <h3>Da ISS a Marte</h3>
          <p>
            Experimentos na ISS ajudam a estudar o cultivo espacial. Seus
            resultados não equivalem à validação de uma estufa marciana.
            Atmosfera, radiação e gravidade exigem pesquisa específica.
          </p>
        </section>
      </div>
      <p className={u.notice}>
        Este protótipo não simula produtividade, consumo, colheita ou
        viabilidade de cultivo em Marte. Os controles são demonstrativos e não
        representam recomendações agronômicas. Plantas em uma estufa humana não
        constituem evidência de vida nativa em Marte.
      </p>
      <p className={u.source}>
        Referências:{" "}
        <a
          href="https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/"
          target="_blank"
          rel="noreferrer"
        >
          NASA · Growing Plants in Space
        </a>{" "}
        ·{" "}
        <a
          href="https://science.nasa.gov/biological-physical/investigations/veg-05-rjtim/"
          target="_blank"
          rel="noreferrer"
        >
          NASA · Veg-05
        </a>{" "}
        ·{" "}
        <a
          href="https://science.nasa.gov/biological-physical/space-crops/"
          target="_blank"
          rel="noreferrer"
        >
          NASA · Space Crops
        </a>
      </p>
    </main>
  );
}
