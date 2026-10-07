import type { Metadata } from "next";
import { NiveauStart } from "./NiveauStart";

export const metadata: Metadata = { title: "Wat past bij jou?" };

export default function NiveauPage() {
  return <NiveauStart />;
}
