import { LocalizedTree } from "@/components/LocalizedTree";
import Link from "next/link";
import s from "../map.module.css";

export function MarsMapsNavigation() {
  return <LocalizedTree>{<nav className={s.marsMapsNav} aria-label="Navegação do Mars Maps">
    <Link href="/mars-maps" aria-label="Mars Maps">Mars Maps</Link>
    <Link href="/mind-space">Mind Space</Link>
    <Link href="/mars-greenhouse">Mars Greenhouse</Link>
  </nav>}</LocalizedTree>;
}
