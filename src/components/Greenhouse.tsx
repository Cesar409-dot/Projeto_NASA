"use client";

import { LocalizedTree } from "@/components/LocalizedTree";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, ChevronRight, Droplets, FlaskConical, Leaf, RotateCcw, Search, ShieldCheck, Sprout, Sun, Thermometer, Timer, Check } from "lucide-react";
import { crops, scientificSources } from "@/data/crops";
import type { Crop, EnvironmentalReference } from "@/data/crops";
import { advanceDamage, defaultEnvironment, evaluateEnvironment, healthStage, recoveryDamage } from "@/lib/greenhouse-simulation";
import type { Environment, FactorId } from "@/lib/greenhouse-simulation";
import { CropGlyph } from "./CropGlyph";
import s from "./greenhouse.module.css";

const Crop3DViewer = dynamic(() => import("./Crop3DViewer").then((module) => module.Crop3DViewer), {
  ssr: false,
  loading: () => <div className={s.viewerLoading} role="status">Preparando visualização 3D…</div>,
});

type Filter = "all" | "plants" | "biofactory";
type ViewerState = "loading" | "ready" | "fallback";
const filters: Record<Filter, string> = { all: "Todas", plants: "Culturas", biofactory: "Biofábrica" };
const factorMeta: Record<FactorId, { name: string; icon: typeof Droplets }> = {
  water: { name: "Água", icon: Droplets },
  light: { name: "Luz", icon: Sun },
  temperature: { name: "Temperatura", icon: Thermometer },
};
const factorOrder: FactorId[] = ["water", "light", "temperature"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
function qualityLabel(ref: EnvironmentalReference) {
  return ref.quality === "engineering" ? "Alvo de engenharia" : ref.quality === "dossier" ? "Faixa do dossiê" : "Aproximação educativa";
}
function formatValue(value: number, ref: EnvironmentalReference) {
  return (Number.isInteger(value) ? value : value.toFixed(1)) + " " + ref.unit;
}
function rangeState(value: number, ref: EnvironmentalReference) {
  return value < ref.min ? "Abaixo da referência" : value > ref.max ? "Acima da referência" : "Dentro da referência";
}
function levelName(score: number) {
  return ["Próximo da referência", "Estresse leve ilustrativo", "Estresse moderado ilustrativo", "Estresse severo ilustrativo", "Condição crítica ilustrativa"][score];
}

function SliderControl({ crop, factor, value, onChange }: { crop: Crop; factor: FactorId; value: number; onChange: (value: number) => void }) {
  const ref = crop.environmentalReferences[factor];
  const meta = factorMeta[factor];
  const Icon = meta.icon;
  const state = rangeState(value, ref);
  return <LocalizedTree>{(
    <fieldset className={s.sliderControl}>
      <legend><span className={s.sliderTitle}><Icon size={17} aria-hidden="true" />{meta.name}</span><strong>{formatValue(value, ref)}</strong></legend>
      <label className={s.visuallyHidden} htmlFor={crop.id + "-" + factor}>{meta.name} para {crop.name}</label>
      <input id={crop.id + "-" + factor} type="range" min={ref.controlMin} max={ref.controlMax} step={ref.step} value={value} aria-valuetext={formatValue(value, ref) + ". " + state + ". Referência: " + ref.min + " a " + ref.max + " " + ref.unit} onChange={(event) => onChange(Number(event.currentTarget.value))} style={{ "--range-position": (((value - ref.controlMin) / (ref.controlMax - ref.controlMin)) * 100) + "%" } as CSSProperties} />
      <div className={s.rangeLimits}><span>{ref.controlMin}</span><span>{ref.controlMax} {ref.unit}</span></div>
      <div className={s.referenceRow}><span>Referência: <b>{ref.min}–{ref.max} {ref.unit}</b></span><span className={value < ref.min || value > ref.max ? s.factorOutside : s.factorOkay}>{state}</span></div>
      <small className={s.referenceQuality}>{qualityLabel(ref)} · {ref.label}</small>
    </fieldset>
  )}</LocalizedTree>;
}

function explanationFor(crop: Crop, environment: Environment, damage: number) {
  const assessment = evaluateEnvironment(crop, environment);
  const primary = assessment.primary;
  const subject = crop.biologicalType === "biofactory" ? "O biorreator" : "A planta";
  const title = crop.biologicalType === "biofactory" ? "O que está acontecendo com o cultivo?" : "O que está acontecendo com a planta?";
  if (!primary) {
    const body = damage > 0
      ? "As condições ambientais voltaram à referência. A cena mantém " + healthStage(damage) + " por dano ilustrativo acumulado. Avance uma etapa de recuperação; isso não equivale a tempo biológico."
      : "As condições estão dentro das referências usadas nesta simulação. " + subject + " aparece sem sinais visuais significativos de estresse. As referências são alvos de projeto ou aproximações educativas, não previsões para Marte.";
    return { assessment, title, body, symptoms: damage > 0 ? "A aparência acumulada só muda com as etapas manuais de recuperação." : "Sem estresse ambiental detectado pelos limites desta visualização.", adjustment: damage > 0 ? "Mantenha as condições de referência e avance uma etapa de recuperação." : "Mantenha os controles dentro das referências apresentadas." };
  }
  const labels: Record<FactorId, [string, string]> = {
    water: ["Baixa disponibilidade de água", "Água acima da referência"],
    light: ["Exposição à luz reduzida", "Exposição à luz elevada"],
    temperature: ["Temperatura abaixo da referência", "Temperatura acima da referência"],
  };
  const more = assessment.secondary.length ? " Outros fatores também estão fora da faixa: " + assessment.secondary.map((factor) => factor.name.toLocaleLowerCase("pt-BR") + " " + factor.direction).join(", ") + "." : "";
  return { assessment, title, body: primary.summary + " " + primary.symptoms + more + " Nível ambiental: " + levelName(assessment.score).toLocaleLowerCase("pt-BR") + ".", symptoms: primary.symptoms, adjustment: primary.adjustment, factorTitle: labels[primary.id][primary.direction === "abaixo" ? 0 : 1] };
}

function Inventory({ selectedId, onSelect }: { selectedId: string; onSelect: (crop: Crop) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return crops.filter((crop) => {
      const typeMatch = filter === "all" || (filter === "biofactory" ? crop.biologicalType === "biofactory" : crop.biologicalType === "plant");
      const haystack = [crop.name, crop.nutritionCategory, ...crop.searchTerms, ...crop.species.flatMap((item) => [item.commonName, item.scientificName, item.cultivar || ""])].join(" ");
      return typeMatch && (!term || normalize(haystack).includes(term));
    });
  }, [filter, query]);
  return <LocalizedTree>{(
    <section className={s.inventory} aria-labelledby="inventory-title">
      <header className={s.inventoryHeader}><div><span className={s.eyebrow}>01 / INVENTÁRIO DE CULTIVO</span><h2 id="inventory-title">Escolha uma cultura</h2><p>18 categorias agrícolas para explorar. Selecione um cartão para abrir sua inspeção ambiental.</p></div><span className={s.inventoryCount}><b>{String(visible.length).padStart(2, "0")}</b> / 18 disponíveis</span></header>
      <div className={s.inventoryToolbar}>
        <label className={s.searchBox}><Search size={17} aria-hidden="true" /><span className={s.visuallyHidden}>Buscar cultura</span><input type="search" role="searchbox" aria-label="Buscar cultura" placeholder="Buscar nome, espécie ou cultivar…" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /></label>
        <div className={s.filterTabs} role="group" aria-label="Filtrar categorias">{(Object.keys(filters) as Filter[]).map((key) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{filters[key]}</button>)}</div>
      </div>
      <div className={s.cropGrid}>
        {visible.map((crop, index) => <button className={s.cropCard + (selectedId === crop.id ? " " + s.cropCardSelected : "")} type="button" key={crop.id} onClick={() => onSelect(crop)} aria-label={"Inspecionar " + crop.name} aria-pressed={selectedId === crop.id}>
          <span className={s.cardIndex}>{String(index + 1).padStart(2, "0")}</span><span className={s.cardVisual}><CropGlyph crop={crop} /></span><span className={s.cardText}><strong>{crop.name}</strong><small>{crop.biologicalType === "biofactory" ? "BIOFÁBRICA · MICRORGANISMOS" : crop.nutritionCategory}</small></span><ChevronRight className={s.cardArrow} size={16} aria-hidden="true" />
        </button>)}
        {visible.length === 0 ? <div className={s.emptySearch}>Nenhuma categoria encontrada. Tente outro nome ou espécie.</div> : null}
      </div>
    </section>
  )}</LocalizedTree>;
}

function Inspection({ crop, environment, damage, viewerState, onBack, onChange, onRestore, onDamage, onViewerState }: {
  crop: Crop; environment: Environment; damage: number; viewerState: ViewerState; onBack: () => void;
  onChange: (factor: FactorId, value: number) => void; onRestore: () => void;
  onDamage: (update: (current: number) => number) => void; onViewerState: (state: ViewerState) => void;
}) {
  const response = explanationFor(crop, environment, damage);
  const score = response.assessment.score;
  const isHealthyEnvironment = score === 0;
  const biofactory = crop.biologicalType === "biofactory";
  const viewerStatus = useCallback((state: "ready" | "fallback") => onViewerState(state), [onViewerState]);
  return <LocalizedTree>{(
    <section className={s.inspection} aria-labelledby="crop-title">
      <button className={s.backButton} type="button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />Voltar ao inventário</button>
      <div className={s.inspectionLayout}>
        <div className={s.inspectionInfo}>
          <header className={s.inspectionHeading}><span className={s.eyebrow}>{biofactory ? "INSPEÇÃO DE BIOFÁBRICA" : "INSPEÇÃO DA CULTURA"} · {crop.dossierPage}</span><h2 id="crop-title">{crop.name}</h2><p>{crop.description}</p>
            <div className={s.taxonomyBlock}><span>{biofactory ? "ORGANISMOS / ESPÉCIES" : "ESPÉCIES REPRESENTADAS"}</span>{crop.species.map((item) => <div className={s.speciesRow} key={item.commonName + item.scientificName}><span>{item.commonName}</span><em data-language-ignore>{item.scientificName}</em>{item.cultivar ? <small data-language-ignore>{item.cultivar}</small> : null}{item.note ? <small>{item.note}</small> : null}</div>)}</div>
          </header>
          <section className={s.environmentPanel} aria-labelledby="environment-title"><div className={s.panelHeading}><div><span className={s.eyebrow}>02 / SIMULAÇÃO AMBIENTAL</span><h3 id="environment-title">Ajuste o módulo</h3></div><span className={s.statusPill} data-state={score === 0 ? "ok" : "stress"}>{levelName(score)}</span></div><p className={s.environmentIntro}>Os intervalos são referências educativas. Os controles atualizam a cena imediatamente.</p>
            <div className={s.controlStack}>{factorOrder.map((factor) => <SliderControl key={factor} crop={crop} factor={factor} value={environment[factor]} onChange={(value) => onChange(factor, value)} />)}</div>
            <div className={s.controlActions}><button className={s.restoreButton} type="button" onClick={onRestore}><RotateCcw size={15} aria-hidden="true" />Restaurar condições ideais</button><button className={s.resetButton} type="button" onClick={() => onDamage(() => 0)}>Reiniciar dano</button></div>
            <p className={s.restoreHint}>O botão restaura valores de referência (alvos de engenharia ou aproximações educativas), não um ótimo biológico comprovado. Dano visual acumulado é controlado separadamente.</p>
          </section>
          <section className={s.healthPanel} aria-labelledby="health-title"><div className={s.panelHeading}><div><span className={s.eyebrow}>03 / RESPOSTA VISUAL</span><h3 id="health-title">Estado ilustrativo {biofactory ? "do cultivo" : "da planta"}</h3></div><strong className={s.damageStage}>{healthStage(damage)}</strong></div>
            <div className={s.damageTrack} role="meter" aria-label="Dano ilustrativo acumulado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={damage} aria-valuetext={damage + "% · " + healthStage(damage)}><span style={{ width: damage + "%" }} /></div>
            <div className={s.damageActions}><button type="button" onClick={() => onDamage((current) => advanceDamage(current, score))} disabled={score === 0 || damage >= 100}><Timer size={15} aria-hidden="true" />Avançar etapa de exposição</button><button type="button" onClick={() => onDamage((current) => recoveryDamage(current, score))} disabled={!isHealthyEnvironment || damage <= 0}><Check size={15} aria-hidden="true" />Avançar recuperação</button></div>
            <p className={s.simulationCaveat}>Simulação ambiental ilustrativa. Não representa um modelo biológico validado. Cada clique representa uma etapa abstrata, sem duração biológica associada. Estresse atual e dano acumulado são estados separados; não há previsão de crescimento, sobrevivência ou mortalidade.</p>
          </section>
          <section className={s.explanationPanel} aria-live="polite" aria-atomic="true"><span className={s.eyebrow}>LEITURA DA SIMULAÇÃO</span><h3>{response.factorTitle || response.title}</h3><p>{response.body}</p><div className={s.explanationDetail}><b>Sintomas na cena</b><span>{response.symptoms}</span></div><div className={s.explanationDetail}><b>O que ajustar</b><span>{response.adjustment}</span></div>{response.assessment.secondary.length ? <p className={s.secondaryFactors}>Também fora da referência: {response.assessment.secondary.map((item) => item.name + " (" + item.direction + ")").join(" · ")}</p> : null}</section>
          <div className={s.cultivationFacts}>
            <article><span>USO AGRÍCOLA</span><p>{crop.use}</p></article><article><span>MÉTODO DE CULTIVO</span><p>{crop.cultivationMethod}</p></article>
            <article className={s.factPair}><div><span>ÁGUA</span><p>{crop.environmentalReferences.water.explanation}</p></div><div><span>LUZ E TEMPERATURA</span><p>{crop.environmentalReferences.light.explanation} {crop.environmentalReferences.temperature.explanation}</p></div></article>
            <article><span>NUTRIÇÃO E CONTRIBUIÇÃO</span><strong>{crop.nutritionCategory}</strong><p>{crop.nutritionContribution}</p></article><article><span>NUTRIENTES</span><p>{crop.nutrients}</p></article><article><span>CICLO DO DOSSIÊ</span><p>{crop.cycle}</p></article><article className={s.limitation}><span>LIMITAÇÕES CIENTÍFICAS</span><p>{crop.limitations}</p></article>
            <article className={s.sourceBlock}><span>FONTES DESTA CATEGORIA</span><ul>{crop.sources.map((source) => <li key={source.title + source.url}><a href={source.url} target={source.url.startsWith("#") ? undefined : "_blank"} rel={source.url.startsWith("#") ? undefined : "noreferrer"}>{source.title}</a><small>{source.scope}</small></li>)}</ul></article>
          </div>
        </div>
        <aside className={s.viewerColumn} aria-label="Visualização tridimensional da cultura">
          <div className={s.viewerHeading}><div><span className={s.eyebrow}>04 / AMOSTRA PROCEDURAL</span><h3>{biofactory ? "Fotobiorreator" : "Modelo da cultura"}</h3></div><span className={s.viewerBadge}>{viewerState === "ready" ? "WEBGL ATIVO" : viewerState === "fallback" ? "MODO COMPATÍVEL" : "CARREGANDO"}</span></div>
          <div className={s.viewerFrame}><Crop3DViewer key={crop.id} crop={crop} environment={environment} damage={damage} status={viewerState} onStatus={viewerStatus} /><div className={s.viewerCaption}><span>MODELO 3D PROCEDURAL · ILUSTRATIVO</span><span>Arraste para girar · scroll para zoom</span></div></div>
          <p className={s.visualDisclaimer}><ShieldCheck size={15} aria-hidden="true" />Modelos distinguem grupos de culturas, mas não são representações anatômicas. As reações são educativas.</p>
          <div className={s.visualLegend}><span><i className={s.legendHealthy} />Referência</span><span><i className={s.legendStress} />Estresse atual</span><span><i className={s.legendDamage} />Dano acumulado</span></div>
        </aside>
      </div>
    </section>
  )}</LocalizedTree>;
}

export function Greenhouse() {
  const [view, setView] = useState<"inventory" | "inspection">("inventory");
  const [selectedId, setSelectedId] = useState(crops[0].id);
  const [environment, setEnvironment] = useState<Environment>(() => defaultEnvironment(crops[0]));
  const [damage, setDamage] = useState(0);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const crop = crops.find((item) => item.id === selectedId) || crops[0];
  const selectCrop = useCallback((next: Crop) => { setSelectedId(next.id); setEnvironment(defaultEnvironment(next)); setDamage(0); setViewerState("loading"); setView("inspection"); }, []);
  const changeEnvironment = useCallback((factor: FactorId, value: number) => setEnvironment((current) => ({ ...current, [factor]: value })), []);
  const restore = useCallback(() => setEnvironment(defaultEnvironment(crop)), [crop]);
  const updateDamage = useCallback((update: (current: number) => number) => setDamage((current) => update(current)), []);
  const setViewer = useCallback((state: ViewerState) => setViewerState(state), []);
  const backToInventory = useCallback(() => setView("inventory"), []);
  return <LocalizedTree>{<main className={s.page}><div className={s.shell}>
    <header className={s.hero}><div className={s.heroCopy}><span className={s.heroKicker}><Sprout size={15} aria-hidden="true" />MÓDULO DE SUPORTE À VIDA · MISSÃO FUTURA</span><h1>Mars <em>Greenhouse</em></h1><p>Um inventário interativo de culturas para explorar como sistemas de cultivo controlado podem apoiar a vida em uma futura missão marciana.</p><div className={s.orientation}><span className={s.orientationIcon}><Leaf size={17} aria-hidden="true" /></span><p><b>Como explorar:</b> escolha uma categoria, ajuste água, luz e temperatura e observe a representação reagir. O estado ambiental é imediato; o dano acumulado avança somente pelas etapas manuais.</p></div></div><div className={s.heroSeal} aria-label="18 categorias no inventário"><span>CATÁLOGO</span><b>18</b><small>CATEGORIAS</small><i /><small>AMBIENTE CONTROLADO</small></div></header>
    <div className={s.contextStrip}><div><ShieldCheck size={18} aria-hidden="true" /><span><b>Habitat protegido</b>Pressurização, proteção contra radiação e temperatura controlada</span></div><div><Droplets size={18} aria-hidden="true" /><span><b>Água e nutrientes</b>Água tratada e nutrição monitorada</span></div><div><Sun size={18} aria-hidden="true" /><span><b>Luz artificial</b>Espectro e fotoperíodo dependem da cultura</span></div><div><FlaskConical size={18} aria-hidden="true" /><span><b>Substrato tratado</b>Regolito bruto não é solo pronto para cultivo</span></div></div>
    {view === "inventory" ? <Inventory selectedId={selectedId} onSelect={selectCrop} /> : <Inspection crop={crop} environment={environment} damage={damage} viewerState={viewerState} onBack={backToInventory} onChange={changeEnvironment} onRestore={restore} onDamage={updateDamage} onViewerState={setViewer} />}
    <section className={s.scienceFooter} id="referencias" aria-labelledby="sources-title"><div className={s.footerIntro}><span className={s.eyebrow}>05 / BASE CIENTÍFICA E LIMITES</span><h2 id="sources-title">Evidência terrestre, orbital e hipótese marciana não são a mesma coisa.</h2><p>A estufa é um conceito hipotético para uma missão futura e não tem localização operacional definida. Arcadia Planitia é o cenário do dossiê da equipe; o mapa principal permanece em Jezero.</p></div>
      <div className={s.evidenceCards}><article><span>ISS · EXPERIMENTOS</span><p>Veggie, Advanced Plant Habitat e XROOTS estudam cultivo em sistemas controlados na Estação Espacial Internacional.</p></article><article><span>TERRA · SIMULANTES</span><p>Wamelink et al. avaliaram simulantes preparados em laboratório. Isso não equivale a solo de Marte nem comprova todas as 18 categorias.</p></article><article><span>FUTURO · PROPOSTA</span><p>Alvos ambientais e biofábrica aparecem com sua qualidade de referência; não são modelo validado de crescimento em Marte.</p></article></div>
      <div className={s.footerLinks}>{[scientificSources.veggie, scientificSources.aph, scientificSources.xroots, scientificSources.wamelink, scientificSources.pulschen, scientificSources.bvad].map((source) => <a key={source.title} href={source.url} target={source.url.startsWith("#") ? undefined : "_blank"} rel={source.url.startsWith("#") ? undefined : "noreferrer"}>{source.title}<ChevronRight size={14} aria-hidden="true" /></a>)}</div>
      <p className={s.dossierProvenance}>Dossiê técnico da equipe fornecido pelo usuário em texto nesta sessão; o PDF não foi anexado ao repositório. A documentação científica do projeto registra a proveniência e os limites de cada referência.</p>
    </section>
  </div></main>}</LocalizedTree>;
}
