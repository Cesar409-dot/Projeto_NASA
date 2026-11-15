import { LocalizedTree } from "@/components/LocalizedTree";
import type { Metadata } from "next";
import { Greenhouse } from "@/components/Greenhouse";
export const metadata: Metadata = { title: "Mars Greenhouse | Cultivo em Marte" };
export default function Page() {
  return <LocalizedTree>{<Greenhouse />}</LocalizedTree>;
}
