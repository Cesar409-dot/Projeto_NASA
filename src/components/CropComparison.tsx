"use client";
import { crops, comparisonFields } from "@/data/crops";
import s from "./greenhouse.module.css";
import u from "./ui.module.css";

export function CropComparison({
  ids,
  onToggle,
}: {
  ids: string[];
  onToggle: (id: string) => void;
}) {
  const selected = crops.filter((c) => ids.includes(c.id));
  return (
    <section aria-label="Comparação de culturas">
      <div className={u.sectionTitle}>
        <h2>COMPARE NECESSIDADES.</h2>
        <p>Síntese qualitativa, sem ranking de produtividade.</p>
      </div>
      <fieldset className={s.compareOptions}>
        <legend>Selecione culturas para comparar</legend>
        {crops.map((c) => (
          <label key={c.id}>
            <input
              type="checkbox"
              checked={ids.includes(c.id)}
              onChange={() => onToggle(c.id)}
            />
            {c.name}
          </label>
        ))}
      </fieldset>
      {selected.length ? (
        <div
          className={s.tableWrap}
          role="region"
          aria-label="Tabela comparativa de culturas"
          tabIndex={0}
        >
          <table className={s.comparison}>
            <caption>
              Condições de cultivo espacial e limitações da extrapolação para
              Marte
            </caption>
            <thead>
              <tr>
                <th scope="col">Aspecto</th>
                {selected.map((c) => (
                  <th scope="col" key={c.id}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map((f) => (
                <tr key={f.key}>
                  <th scope="row">{f.label}</th>
                  {selected.map((c) => (
                    <td key={c.id}>{c[f.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={u.notice} role="status">
          Selecione ao menos uma cultura para montar a comparação.
        </p>
      )}
      <p className={u.source}>
        Estrutura de pesquisa preparada para revisão da equipe de Química.
        Valores futuros deverão registrar cultivar, unidades, condições
        experimentais e fonte. Não há recomendação agronômica para Marte.
      </p>
    </section>
  );
}
