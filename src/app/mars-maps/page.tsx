import { LocalizedTree } from "@/components/LocalizedTree";
import type { Metadata } from "next";
import { MapExplorer } from "@/components/MapExplorer";
export const metadata: Metadata = { title: "Mars Maps" };
export default function MarsMaps() {
  return <LocalizedTree>{<MapExplorer />}</LocalizedTree>;
}
