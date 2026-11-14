import Link from "next/link";
import { ArrowUpRight, ArrowRight, Map, Brain, Sprout } from "lucide-react";
import s from "./page.module.css";
import u from "@/components/ui.module.css";
const fronts = [
  {
    title: "Mars Maps",
    subtitle: "CONHEÇA O TERRENO",
    text: "Explore Jezero por camadas e conecte lugares a perguntas científicas.",
    href: "/mars-maps",
    icon: Map,
  },
  {
    title: "Mind Space",
    subtitle: "CUIDE DE QUEM EXPLORA",
    text: "Uma pausa para pensar no bem-estar, na conexão e na vida longe de casa.",
    href: "/mind-space",
    icon: Brain,
  },
  {
    title: "Mars Greenhouse",
    subtitle: "CULTIVE POSSIBILIDADES",
    text: "Descubra como a pesquisa com plantas aproxima a vida das próximas fronteiras.",
    href: "/mars-greenhouse",
    icon: Sprout,
  },
];
export default function Home() {
  return (
    <main id="main" className={u.page} style={{ paddingTop: 0 }}>
      <section className={s.hero}>
        <div className={s.content}>
          <div className={u.eyebrow}>
            <span className={u.dot} /> GUIA DE CAMPO PARA A PRÓXIMA FRONTEIRA
          </div>
          <h1>
            UM NOVO MUNDO.
            <br />O MESMO{" "}
            <em>
              ESPÍRITO
              <br />
              EXPLORADOR.
            </em>
          </h1>
          <p>
            Sobreviver em Marte começa com compreender. Explore o terreno, cuide
            da mente e descubra como cultivar o futuro.
          </p>
          <div className={s.actions}>
            <Link href="/mars-maps" className={u.button}>
              Explorar Mars Maps <ArrowUpRight size={18} />
            </Link>
            <a href="#mission" className={s.subLink}>
              Conheça a missão ↓
            </a>
          </div>
        </div>
        <div
          className={s.planet}
          role="img"
          aria-label="Ilustração artística de Marte, sem escala científica"
        />
        <span className={s.planetLabel}>
          MARS / SOL IV
          <br />
          ILUSTRAÇÃO ARTÍSTICA · SEM ESCALA
        </span>
      </section>
      <div className={s.coordinates}>
        <span>DESTINO: CRATERA JEZERO</span>
        <span>CIÊNCIA ABERTA. CURIOSIDADE SEM LIMITES.</span>
      </div>
      <section id="mission">
        <div className={u.sectionTitle}>
          <h2>UMA MISSÃO. TRÊS PERSPECTIVAS.</h2>
          <p>O terreno é só o começo.</p>
        </div>
        <div className={u.grid}>
          {fronts.map((f, i) => (
            <Link href={f.href} className={s.card} key={f.title}>
              <div className={u.row}>
                <f.icon size={27} />
                <span className={u.label}>0{i + 1}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <div className={s.cardBottom}>
                <span>{f.subtitle}</span>
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className={s.science}>
        <div>
          <div className={u.eyebrow}>DA OBSERVAÇÃO À EXPLORAÇÃO</div>
          <h2>
            O CONHECIMENTO É<br />
            NOSSO PRIMEIRO EQUIPAMENTO.
          </h2>
        </div>
        <div>
          <p>
            Um protótipo para o NASA Space Apps Challenge que conecta exploração
            geográfica, fatores humanos e agricultura espacial. O Mars Maps é o
            núcleo: dados de missões abrem novas formas de olhar para Marte.
          </p>
          <a
            href="https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/"
            target="_blank"
            rel="noreferrer"
          >
            Conhecer o desafio oficial <ArrowRight size={13} />
          </a>
        </div>
      </section>
    </main>
  );
}
