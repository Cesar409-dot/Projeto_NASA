import type { Metadata } from "next";
import { Greenhouse } from "@/components/Greenhouse";
export const metadata: Metadata = { title: "Estufa Marciana | Guia de Sobrevivência em Marte" };
export default function Page() {
  return <Greenhouse />;
}
