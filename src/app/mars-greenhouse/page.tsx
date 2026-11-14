import type { Metadata } from "next";
import { Greenhouse } from "@/components/Greenhouse";
export const metadata: Metadata = { title: "Mars Greenhouse" };
export default function Page() {
  return <Greenhouse />;
}
