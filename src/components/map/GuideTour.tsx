"use client";
import { LocalizedTree } from "@/components/LocalizedTree";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import u from "../ui.module.css";
import s from "../map.module.css";

const STORAGE_KEY = "mars-maps-guide-complete";
const EVENT_NAME = "mars-maps-guide-state";
const steps = [
  { target: "map", title: "Conhecendo o Mars Maps", text: "O Mars Maps ajuda a visualizar e planejar explorações da superfície de Marte. Arraste o mapa para se mover e use +/− para ajustar o zoom. Os pontos laranja são locais científicos; pontos azuis são marcadores próprios. Os contornos indicam origem (verde) e destino (azul claro)." },
  { target: "origin", title: "Escolhendo a origem", text: "A origem representa o ponto onde sua exploração começará. Selecione um local científico do catálogo ou um marcador que você adicionou." },
  { target: "destination", title: "Escolhendo o destino", text: "O destino é onde a exploração termina. Escolha outro ponto disponível. A origem e o destino juntos permitem calcular a estimativa da rota." },
  { target: "route-type", title: "Entendendo o tipo de rota", text: "Rota direta: conexão pelo arco de grande círculo, com distância geométrica aproximada. Rota pelo terreno: busca um caminho na grade de Jezero (100 m) e penaliza inclinações; é experimental e depende da cobertura local. Nenhuma opção verifica segurança ou obstáculos reais." },
  { target: "add-marker", title: "Adicionando marcadores", text: "Ative esta opção e clique na posição desejada do terreno para criar um ponto personalizado. Depois de salvo, ele poderá ser escolhido como origem ou destino." },
  { target: "coordinate-entry", title: "Informando coordenadas", text: "Latitude indica a posição norte/sul e longitude a posição leste/oeste no sistema marciano do mapa. No formulário, use graus decimais: latitude entre −90 e 90 e longitude leste entre −180 e 360. Exemplo válido: latitude 18,45 e longitude 77,40. Preencha o nome e confirme em “Salvar marcador”." },
  { target: "basemap", title: "Escolhendo a base cartográfica", text: "MOLA mostra o relevo global sombreado a partir de dados de altimetria; ampliar não cria detalhe além da resolução do produto. A Imagem oficial é um recorte visual de Jezero sem georreferenciamento. Alternar a base muda o fundo, sem apagar seus pontos ou a rota." },
  { target: "summary", title: "Analisando a exploração", text: "O resumo mostra a região científica selecionada, a origem, o destino e a distância geométrica aproximada. Essa distância não considera inclinações, obstáculos, segurança, duração nem o caminho realmente percorrível. Pronto! Agora você já conhece as principais funcionalidades do Mars Maps e pode começar a planejar suas explorações." },
];

function subscribe(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}
function getSnapshot() {
  try { return localStorage.getItem(STORAGE_KEY) === "1" ? "done" : "new"; }
  catch { return "new"; }
}
function getServerSnapshot() { return "new"; }

export function GuideTour({ onPrepareStep, onStart }: { onPrepareStep?: (step: number) => void; onStart?: () => void }) {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spot, setSpot] = useState<DOMRect>();
  const open = manualOpen || (status === "new" && !dismissed);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    onPrepareStep?.(stepIndex);
    const selector = `[data-guide="${step.target}"]`;
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    target.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "smooth" });
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSpot(target.getBoundingClientRect()));
    };
    update();
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    resizeObserver?.observe(target);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, stepIndex, step.target, onPrepareStep]);

  function finish() {
    setManualOpen(false);
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* Keep the tutorial usable without storage. */ }
    window.dispatchEvent(new Event(EVENT_NAME));
    setSpot(undefined);
  }
  function start() {
    onStart?.();
    setStepIndex(0);
    setDismissed(false);
    setManualOpen(true);
  }

  const overlay = open && spot && typeof document !== "undefined" ? (() => {
    const width = Math.min(460, window.innerWidth - 32);
    const left = Math.max(16, Math.min(spot.left, window.innerWidth - width - 16));
    const below = spot.bottom + 18 + 300 < window.innerHeight;
    const top = below
      ? Math.max(12, Math.min(window.innerHeight - 312, spot.bottom + 14))
      : Math.max(12, spot.top - 314);
    return createPortal(<LocalizedTree>{(<>
      <div className={s.tourSpotlight} style={{ left: spot.left - 7, top: spot.top - 7, width: spot.width + 14, height: spot.height + 14 }} />
      <section className={s.tourCard} role="dialog" aria-modal="false" aria-labelledby="tour-title" style={{ left, top, width }}>
        <div className={s.tourCardHead}>
          <span>GUIA · ETAPA {stepIndex + 1} DE {steps.length}</span>
          <button type="button" className={s.tourClose} aria-label="Encerrar tutorial" onClick={finish}>×</button>
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.text}</p>
        <div className={s.tourProgress} aria-label={`Etapa ${stepIndex + 1} de ${steps.length}`}>
          {steps.map((item, index) => <span key={item.target} className={index <= stepIndex ? s.tourProgressDone : s.tourProgressPending} />)}
        </div>
        <div className={s.tourActions}>
          <button type="button" className={u.choice} onClick={finish}>Pular tutorial</button>
          <button type="button" className={u.choice} disabled={stepIndex === 0} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>Voltar</button>
          <button type="button" className={u.button} onClick={() => stepIndex === steps.length - 1 ? finish() : setStepIndex((i) => i + 1)}>{stepIndex === steps.length - 1 ? "Concluir" : "Avançar"}</button>
        </div>
      </section>
    </>)}</LocalizedTree>, document.body);
  })() : null;

  return <LocalizedTree>{<>
    <div className={s.guideActions}><button type="button" className={u.choice} onClick={start}>Como utilizar?</button></div>
    {overlay}
  </>}</LocalizedTree>;
}
