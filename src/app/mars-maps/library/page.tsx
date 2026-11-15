import { LocalizedTree } from "@/components/LocalizedTree";
import type { Metadata } from "next";
import { ExplorationLibrary } from "@/components/map/ExplorationLibrary";
export const metadata: Metadata = { title: "Biblioteca de Explorações" };
export default function LibraryPage() { return <LocalizedTree>{<ExplorationLibrary />}</LocalizedTree>; }
