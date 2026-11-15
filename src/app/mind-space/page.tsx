import { LocalizedTree } from "@/components/LocalizedTree";
import type { Metadata } from "next";
import { MindSpace } from "@/components/MindSpace";
export const metadata: Metadata = { title: "Mind Space" };
export default function Page() {
  return <LocalizedTree>{<MindSpace />}</LocalizedTree>;
}
