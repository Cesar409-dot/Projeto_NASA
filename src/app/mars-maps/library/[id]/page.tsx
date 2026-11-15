import type { Metadata } from "next";
import { ExplorationLibraryDetail } from "@/components/map/ExplorationLibraryDetail";
export const metadata: Metadata = { title: "Detalhes da Exploração" };
export default function LibraryDetailPage() { return <ExplorationLibraryDetail />; }
