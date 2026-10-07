import type { Metadata } from "next";
import { EuropaInstellen } from "./EuropaInstellen";

export const metadata: Metadata = { title: "Europa" };

export default function EuropaPage() {
  return <EuropaInstellen />;
}
