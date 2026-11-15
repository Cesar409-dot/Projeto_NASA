import { LocalizedTree } from "@/components/LocalizedTree";
import Link from "next/link";
import u from "@/components/ui.module.css";
export default function NotFound() {
  return <LocalizedTree>{(
    <main id="main" className={u.page}>
      <div className={u.eyebrow}>404 / FORA DO PERCURSO</div>
      <h1>VAMOS RECALIBRAR.</h1>
      <p style={{ margin: "25px 0" }}>Este caminho não faz parte do atlas.</p>
      <Link className={u.button} href="/">
        Voltar ao início
      </Link>
    </main>
  )}</LocalizedTree>;
}
