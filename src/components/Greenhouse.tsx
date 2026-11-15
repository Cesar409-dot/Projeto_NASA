"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Droplets,
  FlaskConical,
  Leaf,
  RotateCcw,
  RotateCw,
  Search,
  Shield,
  Sprout,
  Sun,
  Thermometer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { crops, scientificSources } from "@/data/crops";
import type { Crop } from "@/data/crops";
import u from "./ui.module.css";
import s from "./greenhouse.module.css";

type Filter = "all" | "plants" | "microbial";
type Environment = {
  temperature: "fria" | "moderada" | "quente";
  water: "baixa" | "intermediaria" | "alta";
  light: "baixa" | "intermediaria" | "alta";
};

const environmentChoices = {
  temperature: [
    { value: "fria", label: "Fria", icon: ArrowDown },
    { value: "moderada", label: "Intermediária", icon: Thermometer },
    { value: "quente", label: "Quente", icon: ArrowUp },
  ],
  water: [
    { value: "baixa", label: "Baixa", icon: Droplets },
    { value: "intermediaria", label: "Intermediária", icon: Droplets },
    { value: "alta", label: "Alta", icon: Droplets },
  ],
  light: [
    { value: "baixa", label: "Baixa", icon: Sun },
    { value: "intermediaria", label: "Intermediária", icon: Sun },
    { value: "alta", label: "Alta", icon: Sun },
  ],
} as const;

const filterLabels: Record<Filter, string> = {
  all: "Todas",
  plants: "Culturas",
  microbial: "Biofábrica",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function BotanicalArtwork({
  crop,
  rotation,
  zoom,
  onRotate,
}: {
  crop: Crop;
  rotation: number;
  zoom: number;
  onRotate: (rotation: number) => void;
}) {
  const dragStart = useRef<{ x: number; rotation: number } | null>(null);
  const title = crop.biologicalType === "microbial"
    ? "Biorreator ilustrativo para " + crop.category
    : "Ilustração botânica conceitual de " + crop.category;

  function startDrag(event: ReactPointerEvent<SVGSVGElement>) {
    dragStart.current = { x: event.clientX, rotation };
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function drag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragStart.current) return;
    const delta = event.clientX - dragStart.current.x;
    onRotate(dragStart.current.rotation + delta * 0.8);
  }

  function stopDrag() {
    dragStart.current = null;
  }

  return (
    <svg
      className={s.artwork}
      viewBox="0 0 420 430"
      role="img"
      aria-label={title + " — representação vetorial, não anatômica"}
      style={{
        transform:
          "perspective(900px) rotateY(" +
          rotation +
          "deg) scale(" +
          zoom +
          ")",
      }}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
    >
      <title>{title}</title>
      <ellipse cx="210" cy="364" rx="146" ry="29" fill="#b5c991" opacity=".1" />
      {crop.biologicalType === "microbial" ? (
        <g className={s.reactorDrawing}>
          <path d="M151 127h118v31l-7 148c-1 22-17 38-38 38h-28c-21 0-37-16-38-38l-7-148z" />
          <ellipse cx="210" cy="128" rx="59" ry="15" />
          <path d="M161 234c30-13 68 14 100-3v71c-1 16-12 28-29 28h-43c-16 0-27-11-28-27z" className={s.reactorFluid} />
          <path d="M182 99v27m56-27v27m-28-24v71m-43-22h86m-70 42c16 11 42 11 58 0" className={s.reactorLine} />
          <circle cx="184" cy="269" r="5" className={s.bubble} />
          <circle cx="213" cy="286" r="7" className={s.bubble} />
          <circle cx="238" cy="257" r="4" className={s.bubble} />
          <path d="M156 171h-25v77h25m108-77h25v77h-25" className={s.reactorLine} />
          <rect x="174" y="356" width="72" height="12" rx="3" />
        </g>
      ) : (
        <g className={s.plantDrawing}>
          <path d="M210 321V128" className={s.stem} />
          <path d="M206 228c-38-45-67-35-76-12 13 28 42 34 76 20m8-47c31-44 62-37 73-16-11 26-39 35-73 24m-7-51c-27-34-52-27-60-9 9 21 31 28 60 19m14 54c34-34 58-24 62-5-11 20-33 25-62 15" className={s.leafShape} />
          <path d="M133 215l68 19m77-77l-64 28m-55-73l48 34m82 51l-60 11" className={s.leafVein} />
          {crop.visual === "grain" ? (
            <g className={s.cropAccent}>
              <path d="M171 138c-17-20-9-37 2-43 12 8 14 25 6 40m30 2c-14-23-3-39 10-44 11 10 9 28-3 43m20 9c-9-24 5-37 19-38 9 13 3 29-11 40" />
              <path d="M166 100l10 33m27-43l6 39m43-30l-14 39" className={s.leafVein} />
            </g>
          ) : null}
          {crop.visual === "tuber" || crop.visual === "root" ? (
            <g className={s.underground}>
              <path d="M70 325c68-14 136-6 280-1" />
              {crop.visual === "root" ? (
                <>
                  <path d="M207 311c-4 26-15 55-13 82 8 9 21 10 31 0-5-29-7-55-9-82z" />
                  <path d="M207 328l-18 22m30-13l18 23m-37-7l-15 21" className={s.rootDetail} />
                </>
              ) : (
                <>
                  <ellipse cx="157" cy="352" rx="35" ry="20" transform="rotate(-22 157 352)" />
                  <ellipse cx="246" cy="352" rx="39" ry="18" transform="rotate(18 246 352)" />
                  <path d="M157 335v31m-16-25l27 24m78-27v28m-16-19l31 17" className={s.rootDetail} />
                </>
              )}
            </g>
          ) : null}
          {crop.visual === "fruit" || crop.visual === "vine" ? (
            <g className={s.fruitDrawing}>
              <path d="M148 248c-5 14-7 28-1 39m85-25c-4 17-4 32 1 43m55-49c-5 15-6 26-2 38" className={s.fruitStem} />
              <path d="M134 279c4-22 38-23 43 0l-5 23c-8 12-29 11-35-1z" />
              <path d="M215 303c2-25 37-27 42-3l-4 24c-7 13-29 13-36 0z" />
              {crop.visual === "vine" ? (
                <path d="M267 280c4-20 32-20 35 1l-4 46c-6 12-23 12-29 1z" className={s.cucumber} />
              ) : (
                <path d="M265 290c9-13 32-11 37 4l-4 20c-6 10-24 10-30 0z" />
              )}
              <path d="M144 279l9 5 8-5m60 24l8 5 8-5m45-24l7 4 8-5" className={s.calyx} />
            </g>
          ) : null}
          {crop.visual === "legume" ? (
            <g className={s.pods}>
              <path d="M135 268c-18 17 6 42 28 26 10-8 12-21 5-31" />
              <path d="M251 191c22-11 39 18 18 35-14 11-27 9-34-2" />
              <circle cx="146" cy="278" r="4" /><circle cx="157" cy="288" r="4" />
              <circle cx="264" cy="208" r="4" /><circle cx="271" cy="220" r="4" />
            </g>
          ) : null}
          <path d="M132 323h157" className={s.rootBase} />
        </g>
      )}
    </svg>
  );
}

export function Greenhouse() {
  const [selectedId, setSelectedId] = useState("batata");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [environment, setEnvironment] = useState<Environment>({
    temperature: "moderada",
    water: "intermediaria",
    light: "intermediaria",
  });

  const crop = crops.find((entry) => entry.id === selectedId) || crops[0];
  const visibleCrops = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return crops.filter((entry) => {
      const matchesType =
        filter === "all" ||
        (filter === "plants" && entry.biologicalType === "plant") ||
        (filter === "microbial" && entry.biologicalType === "microbial");
      const matchesQuery =
        !normalizedQuery ||
        normalize(
          [entry.category, entry.nutritionCategory, ...entry.searchTerms].join(
            " ",
          ),
        ).includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [filter, query]);

  const sceneClasses = [
    s.scene,
    environment.water === "baixa" ? s.lowWater : "",
    environment.light === "baixa" ? s.lowLight : "",
    environment.light === "alta" ? s.highLight : "",
    environment.temperature !== "moderada" ? s.temperatureChanged : "",
  ]
    .filter(Boolean)
    .join(" ");

  const environmentalStatus = [
    environment.water === "baixa"
      ? "Aparência de estresse hídrico ilustrativa."
      : "",
    environment.light === "baixa"
      ? "Iluminação da visualização reduzida."
      : "",
    environment.light === "alta"
      ? "Iluminação da visualização ampliada."
      : "",
    environment.temperature !== "moderada"
      ? "Condição térmica alterada; adequação da espécie não avaliada."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  function updateEnvironment<K extends keyof Environment>(
    key: K,
    value: Environment[K],
  ) {
    setEnvironment((current) => ({ ...current, [key]: value }));
  }

  function renderEnvironmentControl<K extends keyof Environment>(
    key: K,
    label: string,
    helper: string,
  ) {
    return (
      <fieldset className={s.controlGroup}>
        <legend>
          <span>{label}</span>
          <small>{helper}</small>
        </legend>
        <div className={s.controlChoices}>
          {environmentChoices[key].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={environment[key] === option.value}
                onClick={() =>
                  updateEnvironment(key, option.value as Environment[K])
                }
              >
                <Icon size={15} aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <main id="main" className={u.page + " " + s.page}>
      <div className={s.shell}>
        <header className={s.hero}>
          <div>
            <div className={u.eyebrow + " " + s.heroEyebrow}>
              <span className={u.dot} />
              03 / AGRICULTURA ESPACIAL
            </div>
            <p className={s.kicker}>GUIA DE SOBREVIVÊNCIA EM MARTE · MÓDULO DE SUPORTE À VIDA</p>
            <h1>
              RAÍZES PARA
              <br />
              OUTROS MUNDOS.
            </h1>
            <p className={s.heroCopy}>
              Um inventário de culturas e sistemas biológicos para investigar
              em uma futura missão. Cada cartão separa conhecimento terrestre,
              ensaios em órbita e hipóteses marcianas.
            </p>
          </div>
          <div className={s.heroStamp}>
            <span>CATÁLOGO AGRÍCOLA</span>
            <strong>18</strong>
            <span>CATEGORIAS</span>
            <div className={s.stampLine} />
            <small>ESTUFA · CONCEITO DE MISSÃO FUTURA</small>
          </div>
        </header>

        <div className={s.scienceBanner} role="note">
          <Shield size={20} aria-hidden="true" />
          <p>
            A estufa é um conceito de suporte à vida em ambiente controlado.
            Cultivo em Marte ainda não foi demonstrado. Resultados da ISS e de
            simulantes terrestres não comprovam produção na superfície marciana.
          </p>
        </div>

        <div className={s.dashboard}>
          <section className={s.inventory} aria-label="Inventário de culturas">
            <div className={s.sectionEyebrow}>01 / SELECIONE UMA CATEGORIA</div>
            <div className={s.inventoryHeading}>
              <h2>Inventário</h2>
              <span>{visibleCrops.length.toString().padStart(2, "0")}</span>
            </div>
            <label className={s.searchBox}>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar cultura"
                placeholder="Buscar nome ou espécie"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className={s.filterRow} aria-label="Filtrar por tipo">
              {(Object.keys(filterLabels) as Filter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {filterLabels[key]}
                </button>
              ))}
            </div>
            <div className={s.cropList}>
              {visibleCrops.length ? (
                visibleCrops.map((entry) => {
                  const originalIndex = crops.findIndex(
                    (item) => item.id === entry.id,
                  );
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={s.cropItem}
                      aria-label={"Selecionar " + entry.category}
                      aria-pressed={crop.id === entry.id}
                      onClick={() => {
                        setSelectedId(entry.id);
                        setRotation(0);
                      }}
                    >
                      <span className={s.cropIndex}>
                        {(originalIndex + 1).toString().padStart(2, "0")}
                      </span>
                      <span className={s.cropItemText}>
                        <strong>{entry.category}</strong>
                        <small>
                          {entry.biologicalType === "microbial"
                            ? "BIOFÁBRICA · MICRORGANISMOS"
                            : entry.nutritionCategory}
                        </small>
                      </span>
                      {crop.id === entry.id ? (
                        <span className={s.selectedMark} aria-hidden="true">
                          ●
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className={s.emptyResults} role="status">
                  Nenhuma categoria encontrada. Tente outro termo.
                </p>
              )}
            </div>
            <p className={s.inventoryFoot}>
              {crops.filter((entry) => entry.biologicalType === "plant").length}{" "}
              culturas vegetais · 1 biofábrica conceitual
            </p>
          </section>

          <section className={s.viewer} aria-label="Visualização ilustrativa">
            <header className={s.viewerHeader}>
              <div>
                <div className={s.sectionEyebrow}>02 / OBSERVE O ESPÉCIME</div>
                <h2>{crop.category}</h2>
              </div>
              <span className={s.kindBadge}>
                {crop.biologicalType === "microbial"
                  ? "BIORREATOR"
                  : "ILUSTRAÇÃO BOTÂNICA"}
              </span>
            </header>
            <div
              className={sceneClasses}
              data-water={environment.water}
              data-light={environment.light}
              data-temperature={environment.temperature}
            >
              <div className={s.sceneScanline} />
              <div className={s.sceneOrb} />
              <div className={s.sceneTag}>
                <span>VISUALIZADOR</span>
                <strong>
                  {crop.biologicalType === "microbial"
                    ? "SISTEMA DE BIOFÁBRICA"
                    : "CULTURA SELECIONADA"}
                </strong>
              </div>
              <div className={s.sceneModel}>
                <BotanicalArtwork
                  crop={crop}
                  rotation={rotation}
                  zoom={zoom}
                  onRotate={setRotation}
                />
              </div>
              <div className={s.sceneBase}>
                <span>REPRESENTAÇÃO ESQUEMÁTICA</span>
                <span>{Math.round(zoom * 100)}% · VISTA INTERATIVA</span>
              </div>
              {environment.water === "baixa" ||
              environment.temperature !== "moderada" ? (
                <div className={s.sceneAlert} aria-hidden="true">
                  <span />
                  CENÁRIO AMBIENTAL ALTERADO
                </div>
              ) : null}
            </div>
            <div className={s.viewerActions}>
              <div className={s.rotationControls} aria-label="Girar visualização">
                <button
                  type="button"
                  aria-label="Girar cultura para a esquerda"
                  onClick={() => setRotation((value) => value - 18)}
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Girar cultura para a direita"
                  onClick={() => setRotation((value) => value + 18)}
                >
                  <RotateCw size={18} />
                </button>
                <span>ARRASTE A ILUSTRAÇÃO PARA GIRAR</span>
              </div>
              <div className={s.zoomControls}>
                <button
                  type="button"
                  aria-label="Afastar visualização"
                  onClick={() =>
                    setZoom((value) => Math.max(0.7, Number((value - 0.15).toFixed(2))))
                  }
                >
                  <ZoomOut size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Aproximar visualização"
                  onClick={() =>
                    setZoom((value) => Math.min(1.6, Number((value + 0.15).toFixed(2))))
                  }
                >
                  <ZoomIn size={17} />
                </button>
              </div>
            </div>
            <div className={s.simulationNotice} role="status" aria-live="polite">
              <span className={s.noticeMark} />
              <p>
                <strong>Simulação ambiental ilustrativa.</strong> Não representa
                um modelo biológico validado. A ilustração 2,5D é vetorial e não
                anatômica.
              </p>
            </div>

            <section className={s.environmentPanel} aria-label="Controles ambientais">
              <div className={s.environmentHeading}>
                <div>
                  <div className={s.sectionEyebrow}>03 / CENÁRIO VISUAL</div>
                  <h3>Controles ambientais</h3>
                </div>
                <span>SEM PREVISÃO DE CRESCIMENTO</span>
              </div>
              <div className={s.environmentGrid}>
                {renderEnvironmentControl(
                  "temperature",
                  "Temperatura",
                  "condição ilustrativa",
                )}
                {renderEnvironmentControl(
                  "water",
                  "Água disponível",
                  "aporte visual",
                )}
                {renderEnvironmentControl(
                  "light",
                  "Exposição à luz",
                  "iluminação visual",
                )}
              </div>
              <p className={s.environmentStatus} aria-live="polite">
                {environmentalStatus ||
                  "Controles em posição intermediária. Não há avaliação de adequação para esta espécie."}
                {environment.temperature === "moderada"
                  ? " Faixa térmica de referência não cadastrada."
                  : ""}
              </p>
            </section>
          </section>

          <section className={s.sciencePanel} aria-live="polite">
            <div className={s.sectionEyebrow}>04 / FICHA CIENTÍFICA</div>
            <div className={s.evidenceBadge}>
              <span />
              {crop.evidence}
            </div>
            <h2>{crop.category}</h2>
            <p className={s.scienceIntro}>
              {crop.biologicalType === "microbial"
                ? "Categoria de biofábrica distinta das culturas vegetais."
                : "Categoria agrícola do inventário; espécies e cultivares agrupadas continuam identificadas separadamente."}
            </p>

            <div className={s.speciesBlock}>
              <span className={s.fieldLabel}>
                {crop.biologicalType === "microbial"
                  ? "ORGANISMO / CEPA"
                  : "ESPÉCIES REPRESENTADAS"}
              </span>
              <ul>
                {crop.species.map((species) => (
                  <li key={species.commonName + species.scientificName}>
                    <span>{species.commonName}</span>
                    <em>{species.scientificName}</em>
                    {species.note ? <small>{species.note}</small> : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className={s.factList}>
              <article className={s.fact}>
                <span className={s.fieldLabel}>CATEGORIA NUTRICIONAL</span>
                <strong>{crop.nutritionCategory}</strong>
                <p>{crop.nutritionContribution}</p>
              </article>
              <article className={s.fact}>
                <span className={s.fieldLabel}>MÉTODO DE CULTIVO</span>
                <p>{crop.cultivationMethod}</p>
              </article>
              <article className={s.factGrid}>
                <div>
                  <span className={s.fieldLabel}>ÁGUA</span>
                  <p>{crop.waterNeeds}</p>
                </div>
                <div>
                  <span className={s.fieldLabel}>LUZ</span>
                  <p>{crop.lightNeeds}</p>
                </div>
                <div>
                  <span className={s.fieldLabel}>TEMPERATURA</span>
                  <p>{crop.temperature}</p>
                </div>
                <div>
                  <span className={s.fieldLabel}>NUTRIENTES</span>
                  <p>{crop.nutrients}</p>
                </div>
              </article>
              <article className={s.fact}>
                <span className={s.fieldLabel}>CICLO DE CULTIVO</span>
                <p>{crop.cycle}</p>
              </article>
              <article className={s.limitation}>
                <span className={s.fieldLabel}>LIMITAÇÕES CIENTÍFICAS</span>
                <p>{crop.limitation}</p>
              </article>
            </div>

            <div className={s.sourceBlock}>
              <span className={s.fieldLabel}>FONTES DESTA FICHA</span>
              <ul>
                {crop.sources.map((source) => (
                  <li key={source.title + source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <small>{source.scope}</small>
                  </li>
                ))}
              </ul>
              <a
                className={s.documentationLink}
                href="#referencias"
              >
                Ver metodologia e limites das fontes
              </a>
            </div>
          </section>
        </div>

        <section className={s.lifeSupport} aria-labelledby="life-support-title">
          <div className={s.lifeSupportIntro}>
            <div className={s.sectionEyebrow}>05 / CONTEXTO DE ENGENHARIA</div>
            <h2 id="life-support-title">A estufa é um sistema de suporte à vida.</h2>
            <p>
              Plantas não podem depender do ambiente marciano aberto. O módulo
              precisa fornecer e monitorar as condições de cultivo e a
              segurança do alimento.
            </p>
          </div>
          <div className={s.systemGrid}>
            <article>
              <Shield size={20} />
              <strong>Habitat protegido</strong>
              <p>Pressurização, barreira contra radiação e temperatura controlada.</p>
            </article>
            <article>
              <Droplets size={20} />
              <strong>Água e nutrientes</strong>
              <p>Água tratada e recuperada; nutrientes fornecidos em solução ou substrato monitorado.</p>
            </article>
            <article>
              <Sun size={20} />
              <strong>Luz controlada</strong>
              <p>Iluminação artificial configurada e monitorada para a cultura escolhida.</p>
            </article>
            <article>
              <Sprout size={20} />
              <strong>Sistemas em avaliação</strong>
              <p>Hidroponia, aeroponia e substratos tratados exigem validação por cultura.</p>
            </article>
            <article className={s.regolithNote}>
              <FlaskConical size={20} />
              <strong>Regolito não tratado não é solo agrícola</strong>
              <p>
                Uso como substrato depende de tratamento, análise de contaminantes
                e validação. Experimentos com simulantes não substituem testes em Marte.
              </p>
            </article>
            <article className={s.locationNote}>
              <Leaf size={20} />
              <strong>Conceito sem local operacional definido</strong>
              <p>
                O módulo é uma proposta para uma missão futura. Esta interface
                não altera o mapa principal nem define um local de pouso.
              </p>
            </article>
          </div>
        </section>

        <section className={s.references} id="referencias" aria-labelledby="references-title">
          <header>
            <div>
              <div className={s.sectionEyebrow}>06 / LEITURAS E EVIDÊNCIAS</div>
              <h2 id="references-title">Fontes para continuar a pesquisa</h2>
            </div>
            <p>
              A ficha completa, a proveniência do catálogo e as limitações das
              evidências estão documentadas no repositório em
              {" "}docs/GREENHOUSE_SCIENCE.md.
            </p>
          </header>
          <div className={s.referenceGrid}>
            {[
              scientificSources.veggie,
              scientificSources.aph,
              scientificSources.xroots,
              scientificSources.spaceCrops,
              scientificSources.regolith,
              scientificSources.bionutrients,
            ].map((source) => (
              <a
                className={s.referenceCard}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                key={source.title}
              >
                <span>{source.title}</span>
                <p>{source.scope}</p>
                <span className={s.externalArrow}>↗</span>
              </a>
            ))}
          </div>
          <p className={s.dossierNote}>
            O dossiê técnico da equipe não estava disponível neste checkout.
            Parâmetros que dependeriam dele permanecem sem valores e estão
            identificados como pendentes.
          </p>
        </section>
      </div>
    </main>
  );
}
