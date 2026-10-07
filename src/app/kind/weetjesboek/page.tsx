import type { Metadata } from "next";
import { WeetjesboekScherm } from "./WeetjesboekScherm";

export const metadata: Metadata = { title: "Je weetjesboek" };

export default function Page() {
  return <WeetjesboekScherm />;
}
